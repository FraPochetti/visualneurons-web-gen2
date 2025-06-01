# Task: Build Credit Management Lambda Functions

## Priority: 🟡 HIGH
**Estimated Time:** 4 hours
**Dependencies:** 
- Credit System Data Model (Task 01)
**Owner:** [Assign]

## Problem Statement
Need serverless functions to handle all credit operations securely, including balance checks, deductions, and transaction logging.

## Acceptance Criteria
- [ ] Atomic credit deduction before AI operations
- [ ] Real-time balance checking
- [ ] Transaction history API
- [ ] Admin functions for credit adjustments
- [ ] Proper error handling for insufficient credits

## Technical Implementation

### 1. Create Credit Manager Lambda Function
```typescript
// amplify/functions/creditManager/resource.ts
import { defineFunction } from '@aws-amplify/backend';

export const creditManager = defineFunction({
  name: 'creditManager',
  runtime: 'nodejs18.x',
  timeoutSeconds: 30,
  memoryMB: 256,
  environment: {
    USER_CREDITS_TABLE: process.env.USER_CREDITS_TABLE || '',
    CREDIT_TRANSACTIONS_TABLE: process.env.CREDIT_TRANSACTIONS_TABLE || '',
    OPERATION_PRICING_TABLE: process.env.OPERATION_PRICING_TABLE || '',
  }
});
```

### 2. Implement Core Credit Operations
```typescript
// amplify/functions/creditManager/operations.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  UpdateCommand, 
  PutCommand,
  QueryCommand 
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
});

export async function checkAndDeductCredits(
  userId: string,
  provider: string,
  operation: string,
  metadata?: any
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  // Get operation cost
  const cost = await getOperationCost(provider, operation);
  
  // Check and deduct in a single atomic operation
  const params = {
    TableName: process.env.USER_CREDITS_TABLE,
    Key: { userId },
    UpdateExpression: `
      SET balance = balance - :cost,
          totalSpent = totalSpent + :cost,
          lastUpdated = :now,
          #v = #v + :inc
    `,
    ConditionExpression: 'balance >= :cost',
    ExpressionAttributeNames: {
      '#v': 'version'
    },
    ExpressionAttributeValues: {
      ':cost': cost,
      ':now': new Date().toISOString(),
      ':inc': 1
    },
    ReturnValues: 'ALL_NEW' as const
  };

  try {
    const result = await docClient.send(new UpdateCommand(params));
    
    // Log the transaction
    await logCreditTransaction({
      userId,
      type: 'USAGE',
      amount: -cost,
      balanceAfter: result.Attributes!.balance,
      description: `${operation} via ${provider}`,
      metadata: {
        ...metadata,
        provider,
        operation,
        timestamp: new Date().toISOString()
      }
    });

    // Update usage analytics
    await updateUsageAnalytics(userId, provider, operation, cost);

    return { 
      success: true, 
      newBalance: result.Attributes!.balance 
    };
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      // Get current balance for error message
      const balance = await getUserBalance(userId);
      return { 
        success: false, 
        error: `Insufficient credits. Need ${cost} credits, but only have ${balance}` 
      };
    }
    throw error;
  }
}

export async function getUserBalance(userId: string): Promise<number> {
  const result = await docClient.send(new GetCommand({
    TableName: process.env.USER_CREDITS_TABLE,
    Key: { userId }
  }));

  if (!result.Item) {
    // Initialize new user
    await initializeUserCredits(userId);
    return 10; // Default free credits
  }

  return result.Item.balance;
}

export async function getOperationCost(
  provider: string, 
  operation: string
): Promise<number> {
  // Query the pricing table
  const params = {
    TableName: process.env.OPERATION_PRICING_TABLE,
    IndexName: 'providerOperationIndex',
    KeyConditionExpression: 'provider = :provider AND operation = :operation',
    ExpressionAttributeValues: {
      ':provider': provider,
      ':operation': operation
    },
    ScanIndexForward: false, // Get most recent pricing
    Limit: 1
  };

  const result = await docClient.send(new QueryCommand(params));
  
  if (!result.Items || result.Items.length === 0) {
    // Fallback to default pricing
    const defaultPricing = getDefaultPricing(provider, operation);
    if (defaultPricing) {
      return defaultPricing;
    }
    throw new Error(`No pricing found for ${provider}:${operation}`);
  }

  return result.Items[0].creditCost;
}

async function initializeUserCredits(userId: string): Promise<void> {
  const params = {
    TableName: process.env.USER_CREDITS_TABLE,
    Item: {
      userId,
      balance: 10, // Free credits
      freeCredits: 10,
      paidCredits: 0,
      totalSpent: 0,
      lastUpdated: new Date().toISOString(),
      version: 1
    },
    ConditionExpression: 'attribute_not_exists(userId)'
  };

  try {
    await docClient.send(new PutCommand(params));
    
    // Log initial credit grant
    await logCreditTransaction({
      userId,
      type: 'INITIAL',
      amount: 10,
      balanceAfter: 10,
      description: 'Welcome bonus - 10 free credits',
      metadata: {
        source: 'signup_bonus'
      }
    });
  } catch (error: any) {
    // User already exists, ignore
    if (error.name !== 'ConditionalCheckFailedException') {
      throw error;
    }
  }
}

async function logCreditTransaction(transaction: {
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  metadata?: any;
}): Promise<void> {
  const params = {
    TableName: process.env.CREDIT_TRANSACTIONS_TABLE,
    Item: {
      id: uuidv4(),
      ...transaction,
      createdAt: new Date().toISOString()
    }
  };

  await docClient.send(new PutCommand(params));
}

export async function getCreditHistory(
  userId: string,
  limit: number = 50,
  lastEvaluatedKey?: any
): Promise<{
  transactions: any[];
  lastEvaluatedKey?: any;
}> {
  const params = {
    TableName: process.env.CREDIT_TRANSACTIONS_TABLE,
    IndexName: 'userIdIndex',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ScanIndexForward: false, // Most recent first
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey
  };

  const result = await docClient.send(new QueryCommand(params));
  
  return {
    transactions: result.Items || [],
    lastEvaluatedKey: result.LastEvaluatedKey
  };
}

// Admin functions
export async function adjustUserCredits(
  adminId: string,
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  // Verify admin permissions (implement your admin check)
  if (!isAdmin(adminId)) {
    throw new Error('Unauthorized');
  }

  const params = {
    TableName: process.env.USER_CREDITS_TABLE,
    Key: { userId },
    UpdateExpression: `
      SET balance = balance + :amount,
          lastUpdated = :now,
          #v = #v + :inc
    `,
    ExpressionAttributeNames: {
      '#v': 'version'
    },
    ExpressionAttributeValues: {
      ':amount': amount,
      ':now': new Date().toISOString(),
      ':inc': 1
    },
    ReturnValues: 'ALL_NEW' as const
  };

  const result = await docClient.send(new UpdateCommand(params));
  
  // Log admin adjustment
  await logCreditTransaction({
    userId,
    type: amount > 0 ? 'BONUS' : 'ADJUSTMENT',
    amount,
    balanceAfter: result.Attributes!.balance,
    description: `Admin adjustment: ${reason}`,
    metadata: {
      adminId,
      reason
    }
  });
}
```

### 3. Update AI Dispatcher to Use Credits
```typescript
// amplify/functions/aiDispatcher/handler.ts - Update existing
import { checkAndDeductCredits } from '../creditManager/operations';

export const handler = async (event: any) => {
  const userId = event.identity?.claims?.sub || 'anonymous';
  const operation = event.arguments.operation;
  const providerName = event.arguments.provider || "replicate";
  
  try {
    // Check and deduct credits before operation
    const creditCheck = await checkAndDeductCredits(
      userId,
      providerName,
      operation,
      { requestId: event.request?.headers?.['x-amzn-requestid'] }
    );
    
    if (!creditCheck.success) {
      return {
        __typename: 'InsufficientCreditsError',
        message: creditCheck.error,
        creditsNeeded: await getOperationCost(providerName, operation),
        currentBalance: await getUserBalance(userId)
      };
    }
    
    // Log remaining balance
    logger.info('Credits deducted', { 
      userId, 
      operation,
      provider: providerName,
      newBalance: creditCheck.newBalance 
    });
    
    // ... existing operation code ...
    
  } catch (error) {
    // If operation fails after credit deduction, consider refunding
    // This is a business decision - implement based on requirements
    throw error;
  }
};
```

### 4. Create GraphQL Queries for Frontend
```typescript
// amplify/data/resource.ts - Add to schema
const schema = a.schema({
  // ... existing schema ...
  
  getUserCredits: a.query()
    .returns(a.object({
      balance: a.float().required(),
      freeCredits: a.float().required(),
      paidCredits: a.float().required(),
      totalSpent: a.float().required()
    }))
    .handler(a.handler.function(creditManager))
    .authorization(allow => [allow.authenticated()]),
    
  getCreditHistory: a.query()
    .arguments({
      limit: a.integer().default(50),
      nextToken: a.string()
    })
    .returns(a.object({
      transactions: a.json().required(),
      nextToken: a.string()
    }))
    .handler(a.handler.function(creditManager))
    .authorization(allow => [allow.authenticated()]),
    
  getOperationCost: a.query()
    .arguments({
      provider: a.string().required(),
      operation: a.string().required()
    })
    .returns(a.float())
    .handler(a.handler.function(creditManager))
    .authorization(allow => [allow.authenticated()]),
});
```

### 5. Create Credit Service for Frontend
```typescript
// src/services/creditService.ts
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export async function getUserCredits() {
  try {
    const response = await client.queries.getUserCredits();
    return response.data;
  } catch (error) {
    console.error('Error fetching user credits:', error);
    throw error;
  }
}

export async function getCreditHistory(limit?: number, nextToken?: string) {
  try {
    const response = await client.queries.getCreditHistory({ 
      limit, 
      nextToken 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching credit history:', error);
    throw error;
  }
}

export async function getOperationCost(provider: string, operation: string) {
  try {
    const response = await client.queries.getOperationCost({ 
      provider, 
      operation 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching operation cost:', error);
    return 1; // Default cost fallback
  }
}
```

## Testing Plan
1. Test atomic credit deduction under concurrent load
2. Verify insufficient credit errors are handled gracefully
3. Test transaction logging accuracy
4. Verify admin credit adjustments work
5. Test edge cases (negative balance prevention, etc.)
6. Performance test with 1000+ concurrent operations

## Monitoring
- CloudWatch metrics for credit operations
- Alert on repeated insufficient credit errors
- Monitor average credit balance trends
- Track credit adjustment frequency
- Alert on unusual spending patterns

## Security Considerations
- All credit operations server-side only
- Implement request signing for admin operations
- Rate limit credit check endpoints
- Audit log all credit modifications
- Encrypt sensitive transaction metadata

## Next Steps
1. Create credit purchase UI (linked to Stripe)
2. Build admin dashboard for credit management
3. Implement credit expiry (if needed)
4. Add bulk credit operations for promotions 