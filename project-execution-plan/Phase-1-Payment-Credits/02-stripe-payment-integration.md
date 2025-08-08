# Task: Integrate Stripe Payment Processing

## Priority: 🟡 HIGH
**Estimated Time:** 8 hours
**Dependencies:** 
- Credit System Data Model (Task 01)
- Stripe Account with API keys
**Owner:** [Assign]

## Problem Statement
Users need a secure way to purchase credits. Stripe provides industry-standard payment processing with support for various payment methods.

## Acceptance Criteria
- [ ] Secure Stripe checkout integration
- [ ] Support for card payments
- [ ] Webhook handling for payment confirmation
- [ ] Automatic credit addition on successful payment
- [ ] Payment history tracking
- [ ] Refund capability for admins

## Technical Implementation

### 1. Install Stripe Dependencies
```bash
# In the main project
npm install stripe @stripe/stripe-js

# In the Lambda function
cd amplify/functions/paymentProcessor
npm install stripe
```

### 2. Create Payment Processor Lambda
```typescript
// amplify/functions/paymentProcessor/handler.ts
import Stripe from 'stripe';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  const { operation } = JSON.parse(event.body);

  switch (operation) {
    case 'createCheckoutSession':
      return await createCheckoutSession(event);
    case 'handleWebhook':
      return await handleWebhook(event);
    case 'getPaymentHistory':
      return await getPaymentHistory(event);
    default:
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid operation' })
      };
  }
};

async function createCheckoutSession(event: any) {
  const { packageId, userId, userEmail } = JSON.parse(event.body);
  
  // Get package details
  const creditPackage = await getCreditPackage(packageId);
  if (!creditPackage) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Package not found' })
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: creditPackage.currency,
          product_data: {
            name: creditPackage.name,
            description: creditPackage.description,
            metadata: {
              credits: creditPackage.credits.toString(),
            }
          },
          unit_amount: Math.round(creditPackage.price * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/pricing?payment=cancelled`,
      customer_email: userEmail,
      metadata: {
        userId,
        packageId,
        credits: creditPackage.credits.toString(),
      },
      // Enable tax collection if needed
      automatic_tax: { enabled: false },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      })
    };
  } catch (error) {
    console.error('Stripe session creation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create checkout session' })
    };
  }
}

async function handleWebhook(event: any) {
  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook signature verification failed' })
    };
  }

  // Handle the event
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      await handleSuccessfulPayment(session);
      break;
      
    case 'checkout.session.expired':
      // Log expired sessions for analytics
      console.log('Checkout session expired:', stripeEvent.data.object);
      break;
      
    default:
      console.log(`Unhandled event type ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true })
  };
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const { userId, packageId, credits } = session.metadata!;
  const amount = session.amount_total! / 100; // Convert from cents

  try {
    // Add credits to user account
    await addCreditsToUser(userId, parseFloat(credits), {
      type: 'PURCHASE',
      stripeSessionId: session.id,
      paymentIntentId: session.payment_intent,
      amount: amount,
      packageId: packageId,
    });

    // Log the transaction
    await logPayment({
      userId,
      sessionId: session.id,
      amount,
      credits: parseFloat(credits),
      status: 'completed',
      timestamp: new Date().toISOString(),
    });

    // Send confirmation email
    await sendPaymentConfirmation(session.customer_email as string, {
      credits: parseFloat(credits),
      amount,
      transactionId: session.id,
    });

  } catch (error) {
    console.error('Failed to process successful payment:', error);
    // Implement proper error handling and alerting
    // Consider implementing a retry mechanism
  }
}
```

### 3. Update Amplify Backend Configuration
```typescript
// amplify/backend.ts
import { paymentProcessor } from './functions/paymentProcessor/resource';

const backend = defineBackend({
  // ... existing resources ...
  paymentProcessor,
});

// Add environment variables
backend.paymentProcessor.addEnvironment({
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  USER_CREDITS_TABLE: backend.data.resources.tables['UserCredits'].tableName,
});

// Grant permissions to access DynamoDB
backend.paymentProcessor.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
    resources: [
      backend.data.resources.tables['UserCredits'].tableArn,
      backend.data.resources.tables['CreditTransaction'].tableArn,
    ],
  })
);
```

### 4. Create Frontend Payment Component
```tsx
// src/components/ui/CreditPackageCard.tsx
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CreditPackageCardProps {
  package: {
    id: string;
    name: string;
    credits: number;
    price: number;
    description: string;
    popular?: boolean;
  };
  userId: string;
  userEmail: string;
}

export const CreditPackageCard: React.FC<CreditPackageCardProps> = ({ 
  package: pkg, 
  userId, 
  userEmail 
}) => {
  const [loading, setLoading] = useState(false);
  
  const handlePurchase = async () => {
    setLoading(true);
    
    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          userId,
          userEmail,
        }),
      });
      
      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Stripe redirect error:', error);
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Failed to start purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={`credit-package-card ${pkg.popular ? 'popular' : ''}`}>
      {pkg.popular && <div className="popular-badge">Most Popular</div>}
      <h3>{pkg.name}</h3>
      <div className="credits">{pkg.credits} Credits</div>
      <div className="price">${pkg.price}</div>
      <div className="price-per-credit">
        ${(pkg.price / pkg.credits).toFixed(3)} per credit
      </div>
      <p className="description">{pkg.description}</p>
      <button 
        onClick={handlePurchase}
        disabled={loading}
        className="purchase-button"
      >
        {loading ? 'Processing...' : 'Purchase'}
      </button>
    </div>
  );
};
```

### 5. Create Webhook Endpoint
```typescript
// pages/api/stripe-webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';

// Disable Next.js body parsing to get raw body for Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const buf = await buffer(req);
  const rawBody = buf.toString('utf-8');

  try {
    // Forward to Lambda
    const response = await fetch(process.env.PAYMENT_PROCESSOR_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': req.headers['stripe-signature'] as string,
      },
      body: JSON.stringify({
        operation: 'handleWebhook',
        body: rawBody,
      }),
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
```

### 6. Create Payment Success Page
```tsx
// pages/payment-success.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getUserCredits } from '@/src/services/creditService';

export default function PaymentSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const [credits, setCredits] = useState<number | null>(null);
  
  useEffect(() => {
    if (session_id) {
      // Fetch updated credit balance
      getUserCredits().then(setCredits);
      
      // Clear session ID from URL
      router.replace('/dashboard', undefined, { shallow: true });
    }
  }, [session_id]);
  
  return (
    <div className="payment-success">
      <div className="success-icon">✓</div>
      <h1>Payment Successful!</h1>
      <p>Your credits have been added to your account.</p>
      {credits !== null && (
        <p className="credit-balance">
          Current balance: <strong>{credits} credits</strong>
        </p>
      )}
      <button onClick={() => router.push('/dashboard')}>
        Go to Dashboard
      </button>
    </div>
  );
}
```

## Security Configuration
1. **Store Stripe keys securely** in AWS Secrets Manager
2. **Validate webhook signatures** to prevent fake events
3. **Use HTTPS only** for all payment-related endpoints
4. **Implement idempotency** for webhook processing
5. **Enable Stripe Radar** for fraud protection

## Testing Plan
1. Test with Stripe test cards:
   - Success: 4242 4242 4242 4242
   - Decline: 4000 0000 0000 0002
   - Requires auth: 4000 0025 0000 3155
2. Test webhook delivery and retry logic
3. Verify credit addition is atomic
4. Test payment failure scenarios
5. Verify email notifications work
6. Test concurrent purchases

## Monitoring
- Set up Stripe webhook monitoring
- Alert on payment failures > 5%
- Monitor checkout abandonment rate
- Track average purchase value
- Alert on suspicious activity patterns

## Next Steps
1. Implement subscription plans (if needed)
2. Add support for other payment methods
3. Create admin refund interface
4. Add invoice generation
5. Implement usage-based billing alerts 

## Additional Pre-Reqs from Repo Audit
- [ ] Ensure no frontend code imports server provider classes (clean separation before handling payments)
- [ ] Secure `resizeImage` Function URL with token/signature to avoid abuse during paid flows
- [ ] Establish typed GraphQL error unions; map `INSUFFICIENT_CREDITS` distinctly