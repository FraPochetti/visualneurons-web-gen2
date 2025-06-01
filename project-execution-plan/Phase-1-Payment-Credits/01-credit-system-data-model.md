# Task: Design and Implement Credit System Data Model

## Priority: 🟡 HIGH
**Estimated Time:** 6 hours
**Dependencies:** AWS Amplify Data knowledge
**Owner:** [Assign]

## Problem Statement
Need a robust data model to track user credits, transactions, usage, and pricing. This is the foundation for the entire billing system.

## Acceptance Criteria
- [ ] Data models for credits, transactions, pricing tiers
- [ ] Audit trail for all credit changes
- [ ] Support for different credit packages
- [ ] Transaction history with detailed metadata
- [ ] Efficient queries for balance checks

## Data Model Design

### 1. Update Amplify Schema
```typescript
// amplify/data/resource.ts
const schema = a.schema({
  // ... existing schema ...

  // User credit balance
  UserCredits: a.model({
    id: a.id(),
    userId: a.string().required(),
    balance: a.float().required().default(0),
    freeCredits: a.float().required().default(10), // Initial free credits
    paidCredits: a.float().required().default(0),
    totalSpent: a.float().required().default(0),
    lastUpdated: a.datetime().required(),
    version: a.integer().required().default(1), // For optimistic locking
  })
  .secondaryIndexes(index => [
    index("userId").sortKeys(["lastUpdated"]).queryField("creditsByUser"),
  ])
  .authorization(allow => [
    allow.owner().identityClaim("sub"),
    allow.groups(["Admins"]),
  ]),

  // Credit transactions log
  CreditTransaction: a.model({
    id: a.id(),
    userId: a.string().required(),
    type: a.enum(["PURCHASE", "USAGE", "REFUND", "BONUS", "INITIAL"]),
    amount: a.float().required(), // Positive for credit, negative for debit
    balanceAfter: a.float().required(),
    description: a.string().required(),
    metadata: a.json(), // Store operation details, Stripe info, etc.
    createdAt: a.datetime().required(),
    // Link to operation if applicable
    operationId: a.string(),
    provider: a.string(),
    operationType: a.string(),
  })
  .secondaryIndexes(index => [
    index("userId").sortKeys(["createdAt"]).queryField("transactionsByUser"),
    index("type").sortKeys(["createdAt"]).queryField("transactionsByType"),
  ])
  .authorization(allow => [
    allow.owner().identityClaim("sub"),
    allow.groups(["Admins"]),
  ]),

  // Credit packages for purchase
  CreditPackage: a.model({
    id: a.id(),
    name: a.string().required(),
    credits: a.float().required(),
    price: a.float().required(), // in USD
    currency: a.string().required().default("USD"),
    active: a.boolean().required().default(true),
    popular: a.boolean().default(false), // For UI highlighting
    description: a.string(),
    sortOrder: a.integer().required().default(0),
  })
  .authorization(allow => [
    allow.authenticated().to(["read"]),
    allow.groups(["Admins"]),
  ]),

  // Operation pricing
  OperationPricing: a.model({
    id: a.id(),
    provider: a.string().required(),
    operation: a.string().required(),
    creditCost: a.float().required(),
    active: a.boolean().required().default(true),
    effectiveDate: a.datetime().required(),
  })
  .secondaryIndexes(index => [
    index("provider", "operation")
      .sortKeys(["effectiveDate"])
      .queryField("pricingByOperation"),
  ])
  .authorization(allow => [
    allow.authenticated().to(["read"]),
    allow.groups(["Admins"]),
  ]),

  // Usage analytics
  UsageAnalytics: a.model({
    id: a.id(),
    userId: a.string().required(),
    date: a.date().required(), // YYYY-MM-DD
    provider: a.string().required(),
    operation: a.string().required(),
    count: a.integer().required().default(0),
    creditsCost: a.float().required().default(0),
    averageLatency: a.float(), // in ms
  })
  .secondaryIndexes(index => [
    index("userId", "date").queryField("analyticsByUserDate"),
    index("date", "provider").queryField("analyticsByDateProvider"),
  ])
  .authorization(allow => [
    allow.owner().identityClaim("sub"),
    allow.groups(["Admins"]),
  ]),
});
```

### 2. Create Credit Service Lambda Functions
```typescript
// amplify/functions/creditManager/handler.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  const { operation, userId, amount, description, metadata } = event;

  switch (operation) {
    case 'getBalance':
      return await getBalance(userId);
    case 'deductCredits':
      return await deductCredits(userId, amount, description, metadata);
    case 'addCredits':
      return await addCredits(userId, amount, description, metadata);
    case 'checkSufficient':
      return await checkSufficientCredits(userId, amount);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
};

async function getBalance(userId: string) {
  const result = await docClient.send(new GetCommand({
    TableName: process.env.USER_CREDITS_TABLE,
    Key: { userId }
  }));

  if (!result.Item) {
    // Initialize new user with free credits
    return await initializeUserCredits(userId);
  }

  return {
    balance: result.Item.balance,
    freeCredits: result.Item.freeCredits,
    paidCredits: result.Item.paidCredits
  };
}

async function deductCredits(
  userId: string, 
  amount: number, 
  description: string,
  metadata: any
) {
  // Use conditional update to ensure atomicity
  const params = {
    TableName: process.env.USER_CREDITS_TABLE,
    Key: { userId },
    UpdateExpression: `
      SET balance = balance - :amount,
          totalSpent = totalSpent + :amount,
          lastUpdated = :now,
          version = version + :inc
    `,
    ConditionExpression: 'balance >= :amount',
    ExpressionAttributeValues: {
      ':amount': amount,
      ':now': new Date().toISOString(),
      ':inc': 1
    },
    ReturnValues: 'ALL_NEW'
  };

  try {
    const result = await docClient.send(new UpdateCommand(params));
    
    // Log transaction
    await logTransaction({
      userId,
      type: 'USAGE',
      amount: -amount,
      balanceAfter: result.Attributes.balance,
      description,
      metadata
    });

    return { 
      success: true, 
      newBalance: result.Attributes.balance 
    };
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return { 
        success: false, 
        error: 'Insufficient credits' 
      };
    }
    throw error;
  }
}
```

### 3. Create Migration Script for Existing Users
```typescript
// scripts/migrate-users-to-credits.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const INITIAL_FREE_CREDITS = 10;

async function migrateUsers() {
  // Get all existing users
  const users = await getAllUsers();
  
  // Create initial credit records
  const items = users.map(user => ({
    PutRequest: {
      Item: {
        userId: user.id,
        balance: INITIAL_FREE_CREDITS,
        freeCredits: INITIAL_FREE_CREDITS,
        paidCredits: 0,
        totalSpent: 0,
        lastUpdated: new Date().toISOString(),
        version: 1
      }
    }
  }));

  // Batch write in chunks of 25
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [process.env.USER_CREDITS_TABLE]: batch
      }
    }));
  }

  console.log(`Migrated ${users.length} users to credit system`);
}
```

### 4. Default Pricing Configuration
```typescript
// amplify/functions/creditManager/pricing.ts
export const DEFAULT_PRICING = {
  replicate: {
    generateImage: 0.5,      // 0.5 credits
    upscaleImage: 1.0,       // 1 credit
    styleTransfer: 1.5,      // 1.5 credits
    outpaint: 2.0,           // 2 credits
    inpaint: 1.5,            // 1.5 credits
  },
  stability: {
    generateImage: 0.3,      // 0.3 credits
    upscaleImage: 0.6,       // 0.6 credits
    styleTransfer: 0.8,      // 0.8 credits
    outpaint: 1.0,           // 1 credit
    inpaint: 0.8,            // 0.8 credits
  },
  gemini: {
    generateImage: 0.4,      // 0.4 credits
    imageChat: 0.2,          // 0.2 credits per message
  }
};

// Credit packages
export const CREDIT_PACKAGES = [
  {
    name: "Starter Pack",
    credits: 50,
    price: 4.99,
    description: "Perfect for trying out our services"
  },
  {
    name: "Creator Pack",
    credits: 200,
    price: 14.99,
    description: "Great for regular users",
    popular: true
  },
  {
    name: "Pro Pack",
    credits: 500,
    price: 29.99,
    description: "Best value for professionals"
  },
  {
    name: "Enterprise Pack",
    credits: 2000,
    price: 99.99,
    description: "For high-volume users"
  }
];
```

## Testing Plan
1. Test credit initialization for new users
2. Verify atomic credit deduction under load
3. Test concurrent operations don't cause race conditions
4. Validate transaction logging accuracy
5. Test balance queries performance with large datasets
6. Verify admin can adjust credits

## Performance Considerations
- Use DynamoDB conditional updates for atomicity
- Implement caching for pricing lookups
- Consider read replicas for balance checks
- Use batch operations where possible
- Implement connection pooling in Lambda

## Security Notes
- Never expose internal credit amounts in client
- All credit operations must be server-side
- Implement rate limiting on credit checks
- Log all credit modifications for audit
- Use encryption for sensitive transaction data

## Next Steps
1. Implement Stripe integration (Task 02)
2. Create credit management UI
3. Set up monitoring for credit anomalies
4. Document credit system for support team 