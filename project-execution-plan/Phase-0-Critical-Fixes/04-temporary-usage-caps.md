# Task: Create Temporary Usage Caps

## Priority: 🔴 CRITICAL  
**Estimated Time:** 1 hour
**Dependencies:** Task 01 (Rate Limiting)
**Owner:** [Assign]

## Problem Statement
Even with rate limiting, users could still generate significant costs (10 ops/hour × 24 hours × $0.02/op = $4.80/day per user). Need hard caps until payment system is ready.

## Acceptance Criteria
- [ ] Daily operation limit per user (50 operations)
- [ ] Clear messaging when approaching limit
- [ ] Admin bypass for testing
- [ ] Reset at midnight UTC
- [ ] Visible usage counter in UI

## Technical Implementation

### 1. Extend Rate Limit Table for Daily Caps
```typescript
// amplify/functions/aiDispatcher/usageCaps.ts
interface UsageEntry {
  userId: string;
  date: string;  // YYYY-MM-DD
  operationCount: number;
  lastOperation: string;
  ttl: number;  // Auto-cleanup after 7 days
}

const DAILY_OPERATION_LIMIT = 50;
const ADMIN_USERS = ['admin@yourdomain.com']; // Replace with actual

export async function checkDailyUsage(userId: string, userEmail?: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  // Admin bypass
  if (userEmail && ADMIN_USERS.includes(userEmail)) {
    return { allowed: true, remaining: 999, limit: 999 };
  }

  const today = new Date().toISOString().split('T')[0];
  const usage = await getUsageEntry(userId, today);
  
  if (usage && usage.operationCount >= DAILY_OPERATION_LIMIT) {
    return { 
      allowed: false, 
      remaining: 0, 
      limit: DAILY_OPERATION_LIMIT 
    };
  }

  const current = usage?.operationCount || 0;
  await incrementDailyUsage(userId, today);
  
  return {
    allowed: true,
    remaining: DAILY_OPERATION_LIMIT - current - 1,
    limit: DAILY_OPERATION_LIMIT
  };
}
```

### 2. Update Lambda Handler
```typescript
// amplify/functions/aiDispatcher/handler.ts
export const handler = async (event: any) => {
  const userId = event.identity?.claims?.sub || 'anonymous';
  const userEmail = event.identity?.claims?.email;
  
  try {
    // Check daily usage cap
    const usageCheck = await checkDailyUsage(userId, userEmail);
    if (!usageCheck.allowed) {
      return {
        __typename: 'UsageCapError',
        message: `Daily limit reached. You've used all ${usageCheck.limit} operations for today.`,
        remaining: 0,
        resetTime: getNextResetTime()
      };
    }
    
    // Log remaining operations
    logger.info('Usage check', { 
      userId, 
      remaining: usageCheck.remaining,
      limit: usageCheck.limit 
    });
    
    // ... rest of handler code ...
  } catch (error) {
    // ... error handling ...
  }
};
```

### 3. Create Usage Status Component
```tsx
// src/components/ui/UsageStatus.tsx
import { useEffect, useState } from 'react';
import { getUserUsage } from '@/src/services/usageService';

export const UsageStatus: React.FC = () => {
  const [usage, setUsage] = useState({ used: 0, limit: 50, loading: true });
  
  useEffect(() => {
    fetchUsage();
    // Refresh after each operation
    window.addEventListener('operation-complete', fetchUsage);
    return () => window.removeEventListener('operation-complete', fetchUsage);
  }, []);
  
  const fetchUsage = async () => {
    try {
      const data = await getUserUsage();
      setUsage({ ...data, loading: false });
    } catch (error) {
      console.error('Failed to fetch usage', error);
    }
  };
  
  if (usage.loading) return null;
  
  const percentage = (usage.used / usage.limit) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = percentage >= 100;
  
  return (
    <div className={`usage-status ${isNearLimit ? 'warning' : ''} ${isAtLimit ? 'error' : ''}`}>
      <div className="usage-bar">
        <div 
          className="usage-fill" 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="usage-text">
        {isAtLimit ? (
          <span>Daily limit reached. Resets at midnight UTC.</span>
        ) : (
          <span>{usage.limit - usage.used} operations remaining today</span>
        )}
      </div>
      {isNearLimit && !isAtLimit && (
        <div className="usage-warning">
          ⚠️ You're approaching your daily limit
        </div>
      )}
    </div>
  );
};
```

### 4. Add to Navigation
```tsx
// src/components/layout/Navigation.tsx
import { UsageStatus } from '@/src/components/ui/UsageStatus';

export const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      {/* ... existing navigation ... */}
      <div className="nav-status">
        <UsageStatus />
      </div>
    </nav>
  );
};
```

### 5. Create Usage Service
```typescript
// src/services/usageService.ts
import { generateClient } from 'aws-amplify/data';

const client = generateClient();

export async function getUserUsage() {
  try {
    const response = await client.graphql({
      query: `
        query GetUserUsage {
          getUserUsage {
            used
            limit
            resetTime
          }
        }
      `
    });
    
    return response.data.getUserUsage;
  } catch (error) {
    console.error('Error fetching usage:', error);
    return { used: 0, limit: 50, resetTime: null };
  }
}
```

### 6. Add GraphQL Query
```typescript
// amplify/data/resource.ts
const schema = a.schema({
  // ... existing schema ...
  
  getUserUsage: a.query()
    .returns(a.object({
      used: a.integer().required(),
      limit: a.integer().required(),
      resetTime: a.string()
    }))
    .handler(a.handler.function(usageChecker))
    .authorization(allow => [allow.authenticated()]),
});
```

## Styling
```css
/* styles/components/usage-status.css */
.usage-status {
  padding: 8px 16px;
  background: var(--color-surface);
  border-radius: 8px;
  font-size: 14px;
}

.usage-bar {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.usage-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.usage-status.warning .usage-fill {
  background: var(--color-warning);
}

.usage-status.error .usage-fill {
  background: var(--color-error);
}

.usage-warning {
  color: var(--color-warning);
  font-size: 12px;
  margin-top: 4px;
}
```

## Testing Plan
1. Create new user and verify 50 operation limit
2. Test warning appears at 40+ operations
3. Verify operations blocked at 50
4. Check reset at midnight UTC
5. Confirm admin bypass works
6. Test UI updates in real-time

## Communication Plan
1. Add banner announcement about temporary limits
2. Update FAQ with limit explanation
3. Email users about upcoming changes
4. Add in-app notification about limits

## Notes
- This is temporary until credit system launches
- Consider A/B testing different limits
- Monitor user complaints about limits
- Plan graceful transition to credit system 