# Task: Stripe Webhook Infrastructure Setup

## Priority: 🔴 CRITICAL
**Estimated Time:** 4 hours  
**Dependencies:** Stripe integration (Task 02)
**Owner:** [Assign]
**Status:** ⏳ **NEW CRITICAL TASK** - Missing from original plan

## Problem Statement
The original Stripe integration plan mentioned webhooks but didn't properly plan the infrastructure needed for production-grade webhook handling. Stripe webhooks are critical for reliable payment processing but require proper infrastructure setup.

## CRITICAL MISSING COMPONENT
The original plan did not account for:
1. **Webhook endpoint security** and signature verification
2. **Idempotency handling** for duplicate webhooks
3. **Webhook retry logic** and failure handling
4. **Database transactions** for payment state consistency
5. **Monitoring and alerting** for webhook failures

## Acceptance Criteria
- [ ] Secure webhook endpoint with signature verification
- [ ] Idempotent webhook processing (no duplicate credit grants)
- [ ] Comprehensive webhook event handling
- [ ] Webhook failure retry mechanism
- [ ] Database transaction consistency
- [ ] Monitoring and alerting for webhook issues

## Technical Implementation

### 1. Webhook Infrastructure
```typescript
// amplify/functions/stripeWebhookHandler/handler.ts
import Stripe from 'stripe';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const handler = async (event: any) => {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  
  let stripeEvent: Stripe.Event;
  
  try {
    // CRITICAL: Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid signature' })
    };
  }
  
  // CRITICAL: Idempotency check
  const processed = await checkWebhookProcessed(stripeEvent.id);
  if (processed) {
    logger.info('Webhook already processed', { eventId: stripeEvent.id });
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }
  
  try {
    // Process webhook in database transaction
    await processWebhookWithTransaction(stripeEvent);
    
    // Mark webhook as processed
    await markWebhookProcessed(stripeEvent.id);
    
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (error) {
    logger.error('Webhook processing failed', { 
      eventId: stripeEvent.id,
      error: error.message 
    });
    
    // Return 500 so Stripe retries
    return { statusCode: 500, body: JSON.stringify({ error: 'Processing failed' }) };
  }
};
```

### 2. Idempotency System
```typescript
// Database table for webhook deduplication
WebhookEvent: a.model({
  id: a.id(),
  stripeEventId: a.string().required(),
  eventType: a.string().required(),
  processed: a.boolean().required().default(false),
  processedAt: a.datetime(),
  attempts: a.integer().required().default(0),
  lastError: a.string(),
  metadata: a.json(),
})
.authorization(allow => [allow.groups(["System"])]),

async function checkWebhookProcessed(eventId: string): Promise<boolean> {
  const result = await docClient.send(new GetCommand({
    TableName: process.env.WEBHOOK_EVENTS_TABLE,
    Key: { stripeEventId: eventId }
  }));
  
  return result.Item?.processed === true;
}

async function markWebhookProcessed(eventId: string): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: process.env.WEBHOOK_EVENTS_TABLE,
    Item: {
      stripeEventId: eventId,
      processed: true,
      processedAt: new Date().toISOString()
    }
  }));
}
```

### 3. Transaction Consistency
```typescript
// Ensure credit grants are atomic
async function processPaymentSuccessWithTransaction(session: Stripe.Checkout.Session): Promise<void> {
  const { userId, credits, amount } = session.metadata!;
  
  // Start transaction
  const transactionItems = [];
  
  try {
    // 1. Update user credits
    transactionItems.push({
      Update: {
        TableName: process.env.USER_CREDITS_TABLE,
        Key: { userId },
        UpdateExpression: 'SET balance = balance + :credits, paidCredits = paidCredits + :credits',
        ExpressionAttributeValues: {
          ':credits': parseFloat(credits)
        }
      }
    });
    
    // 2. Create transaction record
    transactionItems.push({
      Put: {
        TableName: process.env.CREDIT_TRANSACTIONS_TABLE,
        Item: {
          id: uuidv4(),
          userId,
          type: 'PURCHASE',
          amount: parseFloat(credits),
          description: `Stripe payment: ${session.id}`,
          metadata: {
            stripeSessionId: session.id,
            stripePaymentIntent: session.payment_intent
          },
          createdAt: new Date().toISOString()
        }
      }
    });
    
    // Execute transaction atomically
    await docClient.send(new TransactWriteCommand({
      TransactItems: transactionItems
    }));
    
    logger.info('Payment processed successfully', {
      userId,
      credits,
      sessionId: session.id
    });
    
  } catch (error) {
    logger.error('Transaction failed', {
      userId,
      sessionId: session.id,
      error: error.message
    });
    throw error;
  }
}
```

### 4. Webhook Event Handling
```typescript
async function processWebhookWithTransaction(stripeEvent: Stripe.Event): Promise<void> {
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      await processPaymentSuccessWithTransaction(session);
      break;
      
    case 'checkout.session.expired':
      await handleSessionExpiry(stripeEvent.data.object);
      break;
      
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(stripeEvent.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      // For subscription payments (future)
      await handleSubscriptionPayment(stripeEvent.data.object);
      break;
      
    default:
      logger.info('Unhandled webhook event type', { type: stripeEvent.type });
  }
}
```

### 5. Infrastructure Configuration
```typescript
// amplify/backend.ts - Add webhook handler
const stripeWebhookHandler = defineFunction({
  name: 'stripeWebhookHandler',
  runtime: 'nodejs18.x',
  timeoutSeconds: 60, // Longer timeout for payment processing
  memoryMB: 512,
  environment: {
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    USER_CREDITS_TABLE: backend.data.resources.tables['UserCredits'].tableName,
    CREDIT_TRANSACTIONS_TABLE: backend.data.resources.tables['CreditTransaction'].tableName,
    WEBHOOK_EVENTS_TABLE: backend.data.resources.tables['WebhookEvent'].tableName,
  }
});

// Grant DynamoDB permissions
stripeWebhookHandler.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'dynamodb:GetItem',
      'dynamodb:PutItem', 
      'dynamodb:UpdateItem',
      'dynamodb:TransactWrite'
    ],
    resources: [
      backend.data.resources.tables['UserCredits'].tableArn,
      backend.data.resources.tables['CreditTransaction'].tableArn,
      backend.data.resources.tables['WebhookEvent'].tableArn,
    ],
  })
);
```

### 6. Monitoring and Alerting
```typescript
// CloudWatch monitoring for webhook health
const webhookAlarms = [
  // Alert on webhook failures
  new Alarm(stack, 'WebhookFailureAlarm', {
    metric: new Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Errors',
      dimensions: {
        FunctionName: stripeWebhookHandler.functionName
      },
      statistic: 'Sum',
      period: Duration.minutes(5)
    }),
    threshold: 1,
    evaluationPeriods: 1,
    alarmDescription: 'Stripe webhook processing failed'
  }),
  
  // Alert on high webhook latency  
  new Alarm(stack, 'WebhookLatencyAlarm', {
    metric: new Metric({
      namespace: 'AWS/Lambda',
      metricName: 'Duration',
      dimensions: {
        FunctionName: stripeWebhookHandler.functionName
      },
      statistic: 'Average',
      period: Duration.minutes(5)
    }),
    threshold: 10000, // 10 seconds
    evaluationPeriods: 2,
    alarmDescription: 'Stripe webhook processing too slow'
  })
];
```

## Testing Strategy
```typescript
// Test webhook handling thoroughly
describe('Stripe Webhooks', () => {
  it('should process payment success webhook correctly', async () => {
    const mockEvent = createMockCheckoutSessionEvent();
    
    const response = await handler(mockEvent);
    
    expect(response.statusCode).toBe(200);
    
    const userCredits = await getUserCredits(mockEvent.data.object.metadata.userId);
    expect(userCredits.balance).toBeGreaterThan(0);
  });
  
  it('should handle duplicate webhooks idempotently', async () => {
    const mockEvent = createMockCheckoutSessionEvent();
    
    // Process same webhook twice
    await handler(mockEvent);
    const credits1 = await getUserCredits(mockEvent.data.object.metadata.userId);
    
    await handler(mockEvent);
    const credits2 = await getUserCredits(mockEvent.data.object.metadata.userId);
    
    // Credits should be the same (no double processing)
    expect(credits1.balance).toBe(credits2.balance);
  });
  
  it('should handle webhook signature verification', async () => {
    const mockEvent = createMockWebhookEvent();
    mockEvent.headers['stripe-signature'] = 'invalid-signature';
    
    const response = await handler(mockEvent);
    
    expect(response.statusCode).toBe(400);
  });
});
```

## Production Setup Checklist
- [ ] **Webhook endpoint configured** in Stripe dashboard
- [ ] **Webhook secret stored** securely in AWS Secrets Manager
- [ ] **DynamoDB tables created** for webhook tracking
- [ ] **CloudWatch alarms setup** for monitoring
- [ ] **Test webhooks** with Stripe CLI
- [ ] **Load testing** webhook endpoint
- [ ] **Rollback plan** for webhook failures

## Security Considerations
1. **Always verify webhook signatures** to prevent fake webhooks
2. **Use HTTPS only** for webhook endpoints
3. **Implement rate limiting** to prevent webhook spam
4. **Store webhook secrets securely** in AWS Secrets Manager
5. **Audit log all webhook events** for security monitoring

## CRITICAL: This Infrastructure Was Missing
Without this infrastructure:
- **Double credit grants** could occur from duplicate webhooks
- **Payment failures** would be silent and unhandled  
- **No monitoring** of payment processing health
- **Security vulnerabilities** from unverified webhooks
- **Data inconsistency** from failed transactions

---
**This is a new critical task that must be added to Phase 2**