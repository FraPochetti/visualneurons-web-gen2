import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { CfnApp } from "aws-cdk-lib/aws-pinpoint";
import { Stack } from "aws-cdk-lib/core";
import { aiDispatcher } from './functions/aiDispatcher/resource';
import { resizeImage } from './functions/resizeImage/resource';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth,
  data,
  storage,
  aiDispatcher,
  resizeImage,
});

const resizeLambda = backend.resizeImage.resources.lambda;
// Secure the resize function URL with AWS_IAM so only authorized callers can invoke it
const functionUrl = resizeLambda.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.AWS_IAM,
});

// Allow aiDispatcher to invoke the secured Function URL
backend.aiDispatcher.resources.lambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ['lambda:InvokeFunctionUrl'],
  resources: [resizeLambda.functionArn],
}));

// Also allow direct Lambda invocation as a fallback (preferred path)
backend.aiDispatcher.resources.lambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ['lambda:InvokeFunction'],
  resources: [resizeLambda.functionArn],
}));

const analyticsStack = backend.createStack("analytics-stack");

// create a Pinpoint app
const pinpoint = new CfnApp(analyticsStack, "Pinpoint", {
  name: "visualNeurons",
});

// create an IAM policy to allow interacting with Pinpoint
const pinpointPolicy = new Policy(analyticsStack, "PinpointPolicy", {
  policyName: "PinpointPolicy",
  statements: [
    new PolicyStatement({
      actions: ["mobiletargeting:UpdateEndpoint", "mobiletargeting:PutEvents"],
      resources: [pinpoint.attrArn + "/*"],
    }),
  ],
});

// apply the policy to the authenticated and unauthenticated roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(pinpointPolicy);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(pinpointPolicy);

// patch the custom Pinpoint resource to the expected output configuration
backend.addOutput({
  analytics: {
    amazon_pinpoint: {
      app_id: pinpoint.ref,
      aws_region: Stack.of(pinpoint).region,
    }
  },
});

// Create DynamoDB table for rate limiting
const rateLimitStack = backend.createStack("rate-limit-stack");
const rateLimitTable = new Table(rateLimitStack, 'RateLimitTable', {
  partitionKey: { name: 'userId', type: AttributeType.STRING },
  sortKey: { name: 'windowStart', type: AttributeType.NUMBER },
  billingMode: BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'ttl',
});

// Grant the AI dispatcher Lambda access to the rate limit table
rateLimitTable.grantReadWriteData(backend.aiDispatcher.resources.lambda);

// Add the rate limit table name as an environment variable
backend.aiDispatcher.addEnvironment('RATE_LIMIT_TABLE_NAME', rateLimitTable.tableName);

// Pass the resize function name for direct Invoke from aiDispatcher
backend.aiDispatcher.addEnvironment('RESIZE_FUNCTION_NAME', resizeLambda.functionName);

// Grant aiDispatcher permission to publish custom CloudWatch metrics for cost tracking
backend.aiDispatcher.resources.lambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ['cloudwatch:PutMetricData'],
  resources: ['*'],
}));

// Expose OperationLog table to aiDispatcher and grant write permissions so the function
// can append per-call usage entries (success/error) for in-app usage ledger
const operationLogTable = backend.data.resources.tables['OperationLog'];
backend.aiDispatcher.addEnvironment('OPERATION_LOG_TABLE', operationLogTable.tableName);
backend.aiDispatcher.resources.lambda.addToRolePolicy(new iam.PolicyStatement({
  actions: ['dynamodb:PutItem'],
  resources: [operationLogTable.tableArn],
}));