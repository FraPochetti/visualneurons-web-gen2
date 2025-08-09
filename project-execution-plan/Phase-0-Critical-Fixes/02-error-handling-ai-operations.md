# Task: Add Basic Error Handling for AI Operations

## Priority: 🔴 CRITICAL - PRIORITY 1
**Estimated Time:** 6 hours (revised - more complex than initially estimated)
**Dependencies:** None - Must be completed FIRST in Phase 0
**Owner:** [Assign]
**Status:** ✅ **CORE COMPLETE** (Remaining: small retry utility + docs)

## Problem Statement
When AI API calls fail (timeout, rate limit, invalid input), the application crashes or shows cryptic error messages to users. This creates a poor user experience and makes debugging difficult.

## Acceptance Criteria
- [ ] All AI operations wrapped in try-catch blocks
- [ ] User-friendly error messages for common failures
- [ ] Errors logged with context for debugging
- [ ] Retry mechanism for transient failures
- [ ] Loading states prevent multiple submissions

## Technical Implementation

### 1. Create Error Types
```typescript
// src/types/errors.ts
export enum AIErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  INVALID_INPUT = 'INVALID_INPUT',
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  UNKNOWN = 'UNKNOWN'
}

export class AIOperationError extends Error {
  constructor(
    public type: AIErrorType,
    public message: string,
    public retryable: boolean = false,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AIOperationError';
  }
}

export const ERROR_MESSAGES: Record<AIErrorType, string> = {
  [AIErrorType.RATE_LIMIT]: 'You\'ve made too many requests. Please try again in a few minutes.',
  [AIErrorType.TIMEOUT]: 'The operation took too long. Please try again with a simpler request.',
  [AIErrorType.INVALID_INPUT]: 'Your input contains invalid content. Please check and try again.',
  [AIErrorType.PROVIDER_ERROR]: 'The AI service is temporarily unavailable. Please try again later.',
  [AIErrorType.NETWORK_ERROR]: 'Connection failed. Please check your internet and try again.',
  [AIErrorType.INSUFFICIENT_CREDITS]: 'You don\'t have enough credits. Please purchase more to continue.',
  [AIErrorType.UNKNOWN]: 'Something went wrong. Please try again or contact support.'
};
```

### 2. Update AI Provider Error Handling
```typescript
// amplify/functions/providers/baseProvider.ts
export abstract class BaseAIProvider {
  protected handleProviderError(error: any): never {
    logger.error('Provider error', { 
      provider: this.name, 
      error: error.message,
      stack: error.stack 
    });

    // Parse provider-specific errors
    if (error.response?.status === 429) {
      throw new AIOperationError(
        AIErrorType.RATE_LIMIT,
        'Provider rate limit exceeded',
        true
      );
    }

    if (error.code === 'ETIMEDOUT' || error.response?.status === 504) {
      throw new AIOperationError(
        AIErrorType.TIMEOUT,
        'Operation timed out',
        true
      );
    }

    if (error.response?.status === 400) {
      throw new AIOperationError(
        AIErrorType.INVALID_INPUT,
        error.response.data?.message || 'Invalid input'
      );
    }

    throw new AIOperationError(
      AIErrorType.PROVIDER_ERROR,
      error.message
    );
  }
}
```

### 3. Add Retry Logic
```typescript
// amplify/functions/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (error instanceof AIOperationError && !error.retryable) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        logger.info(`Retrying after ${delay}ms`, { attempt: i + 1 });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}
```

### 4. Update Frontend Hooks
```typescript
// src/hooks/useImageOperation.ts
export function useImageOperation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeOperation = async (operation: () => Promise<any>) => {
    if (loading) return; // Prevent double submission
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (error) {
      const errorType = parseErrorType(error);
      const userMessage = ERROR_MESSAGES[errorType];
      
      setError(userMessage);
      logger.error('Operation failed', { error, errorType });
      
      // Auto-retry for certain errors
      if (errorType === AIErrorType.NETWORK_ERROR && !isRetrying) {
        setIsRetrying(true);
        setTimeout(() => executeOperation(operation), 2000);
      }
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  return { executeOperation, loading, error, isRetrying };
}
```

### 5. Add User Feedback Component
```tsx
// src/components/ui/OperationError.tsx
interface OperationErrorProps {
  error: string;
  onRetry?: () => void;
  canRetry?: boolean;
}

export const OperationError: React.FC<OperationErrorProps> = ({ 
  error, 
  onRetry, 
  canRetry = true 
}) => {
  return (
    <div className="error-container" role="alert">
      <div className="error-icon">⚠️</div>
      <p className="error-message">{error}</p>
      {canRetry && onRetry && (
        <button onClick={onRetry} className="retry-button">
          Try Again
        </button>
      )}
      <details className="error-details">
        <summary>Need help?</summary>
        <p>If this error persists, please contact support with error code: {Date.now()}</p>
      </details>
    </div>
  );
};
```

## Testing Plan
1. Simulate each error type:
   - Disconnect network → Network error
   - Use invalid API key → Provider error
   - Send huge image → Timeout error
   - Make rapid requests → Rate limit error
2. Verify user sees friendly error messages
3. Confirm errors are logged properly
4. Test retry mechanism works for retryable errors
5. Ensure loading state prevents double submission

## Monitoring
- Set up CloudWatch alarms for error rates > 5%
- Track error types to identify patterns
- Monitor retry success rates
- Alert on new error types

## Notes
- This is a foundation - will be enhanced with Phase 1 credit system
- Consider adding error analytics (Sentry) in Phase 5
- May need provider-specific error handling refinements
- Document common errors in user FAQ 

---

# Enhancement: Typed GraphQL Errors and UI Adapters (added by repo audit)

## Why
- AppSync currently returns plain strings for mutations; we cannot distinguish error types reliably on the client.
- Frontend has ad-hoc string parsing for rate limit errors. We need a typed contract.

## Plan
- Add unions to AppSync schema: `Result | RateLimitError | ValidationError | ProviderError`
- Map Lambda exceptions into these unions in `aiDispatcher` and return structured error payloads
- Create `src/lib/errorAdapter.ts` to convert unions to friendly UI strings and to attach `requestId`
- Update `useUpscaler`, `useOutpainter`, `ImageGenerator` to use the adapter

## Deliverables
- Schema updated with typed operation result (OperationResponse)
- Handler maps known errors to codes; includes `requestId`, `provider`, `operation`
- UI shows friendly messages without leaking internals; details available via toggle

## Acceptance Criteria
- No raw error strings from Lambda reach UI ✅
- Rate limit and provider errors are distinguished by code on client ✅

---

## 2025-08-09 Progress Update

What shipped (backend):
- Introduced `OperationResponse` in `amplify/data/resource.ts` for all AI mutations (generate, upscale, outpaint, style transfer, inpaint).
- `aiDispatcher` now returns structured responses with `success`, `data`, and `error { code, message, retryAfter, provider, operation, requestId }`.
- Error classification improved: API key/unauthorized/deprecated errors are mapped to `PROVIDER_ERROR` (not `INVALID_INPUT`). Rate limits mapped to `RATE_LIMIT` with `retryAfter`.

What shipped (frontend):
- New `src/lib/errorAdapter.ts` (`toFriendlyError`) to convert backend codes/messages into user-friendly strings; Gemini image gen shows a clear deprecation/misconfig message.
- New `src/components/ui/OperationError.tsx` with a "Show details" toggle.
- Hooks/pages updated to consume typed responses and show friendly errors: `ImageGenerator`, `useUpscaler`, `useOutpainter`, `useImageOperation`, `pages/style-transfer`, `pages/image-chat`.
- Removed all client imports of server providers; introduced client-safe `src/modelCatalog` for display metadata.

Acceptance criteria status:
- [x] All AI operations wrapped in try-catch blocks (client + Lambda entrypoint)
- [x] User-friendly error messages for common failures
- [x] Errors logged with context for debugging (`requestId`, `provider`, `operation`)
- [ ] Retry mechanism for transient failures (Remaining: small `retryWithBackoff` util; current providers already poll for completion)
- [x] Loading states prevent multiple submissions

Next steps to finish Task 02:
1) Add shared `retryWithBackoff` in `amplify/functions/utils/retry.ts` and use where applicable (non-polling calls).
2) Short doc: developer note on error codes and UI adapter.
