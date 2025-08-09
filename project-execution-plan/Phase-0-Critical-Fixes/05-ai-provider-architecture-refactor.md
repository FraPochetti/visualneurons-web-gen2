# Task: AI Provider Architecture Refactor (MOVED FROM PHASE 3)

## Priority: 🔴 CRITICAL - PRIORITY 3
**Estimated Time:** 8 hours
**Dependencies:** Error handling (Task 02) must be completed first
**Owner:** [Assign]
**Status:** ⏳ **MOVED TO PHASE 0** - Critical foundation work

## Problem Statement
Current AI provider implementation has massive code duplication, inconsistent error handling, and poor abstraction. Multiple providers (Replicate, Stability, Gemini) have different patterns making maintenance difficult and error-prone.

## WHY MOVED TO PHASE 0
This refactor is **foundational** and must be completed before the credit system in Phase 2. Clean provider architecture is essential for:
1. Consistent error handling across all providers
2. Reliable cost tracking for the payment system
3. Proper capability discovery for the UI
4. Maintainable code for future provider additions

## Acceptance Criteria
- [ ] Eliminate ALL code duplication across providers
- [ ] Consistent error handling and retry logic
- [ ] Proper capability discovery system
- [ ] Base provider class with shared functionality
- [ ] Configuration-driven model selection
- [ ] Provider-agnostic operation interface
- [ ] Google provider supports dual transport: legacy Gemini API (temporary) and Vertex AI via service account; defaults to Vertex

## Current Problems Identified

### 1. Code Duplication (CRITICAL)
```typescript
// ❌ BAD: Duplicated in every provider
let completed = null;
for (let i = 0; i < 15; i++) {
    const latest = await replicate.predictions.get(prediction.id);
    if (latest.status !== "starting" && latest.status !== "processing") {
        completed = latest;
        break;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
}
```

### 2. Inconsistent Error Handling (BLOCKING PAYMENT SYSTEM)
```typescript
// ❌ BAD: Different error patterns per provider
// Replicate throws specific errors
// Stability returns different error formats  
// Gemini has different retry logic
```

### 3. Hardcoded Models (MAINTENANCE NIGHTMARE)
```typescript
// ❌ BAD: Hardcoded throughout code
const GENERATE_IMAGE_MODEL = "black-forest-labs/flux-1.1-pro-ultra";
const UPSCALE_IMAGE_VERSION = "dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e";
```

## Refactored Solution

### 1. Create Base Provider Class
```typescript
// amplify/functions/providers/BaseAIProvider.ts
export abstract class BaseAIProvider implements IAIProvider {
  protected abstract config: ProviderConfig;
  
  // Shared polling logic - NO MORE DUPLICATION
  protected async pollForCompletion<T>(
    pollFn: () => Promise<PredictionStatus<T>>,
    timeoutMs: number = 30000,
    intervalMs: number = 2000
  ): Promise<T> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const status = await pollFn();
        
        if (status.isComplete) {
          if (status.isSuccess) {
            return status.result!;
          } else {
            throw new AIOperationError(
              AIErrorType.PROVIDER_ERROR,
              status.error || 'Operation failed',
              false
            );
          }
        }
        
        await this.delay(intervalMs);
      } catch (error) {
        if (error instanceof AIOperationError) {
          throw error;
        }
        
        // Consistent retry logic across ALL providers
        if (this.isRetryableError(error)) {
          await this.delay(intervalMs);
          continue;
        }
        
        throw new AIOperationError(
          AIErrorType.NETWORK_ERROR,
          error.message,
          true
        );
      }
    }
    
    throw new AIOperationError(
      AIErrorType.TIMEOUT,
      `Operation timed out after ${timeoutMs}ms`,
      true
    );
  }
  
  // Consistent capability discovery
  public supportsOperation(operation: AIOperation): boolean {
    return this.config.supportedOperations.includes(operation);
  }
}
```

### 2. Configuration-Driven Models
```typescript
// amplify/functions/providers/config/providerConfigs.ts
export const REPLICATE_CONFIG: ProviderConfig = {
  name: "Replicate",
  serviceProvider: "replicate",
  apiEndpoint: "https://api.replicate.com/v1/predictions",
  supportedOperations: ['generateImage', 'upscaleImage'],
  models: {
    generateImage: {
      id: "black-forest-labs/flux-1.1-pro-ultra",
      displayName: "Flux 1.1 Pro Ultra",
      costMultiplier: 1.0,
      maxRetries: 3,
      timeoutMs: 60000
    }
    // All models defined in config, not code
  }
};
```

### 3. Provider Discovery Service
```typescript
// services/providerService.ts
export class ProviderService {
  private providers: Map<string, BaseAIProvider> = new Map();
  
  getProvidersForOperation(operation: AIOperation): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.supportsOperation(operation))
      .map(([name, _]) => name);
  }
}
```

## Implementation Steps
1. **Create base classes and interfaces** (2 hours)
2. **Migrate Replicate provider first** (2 hours)
3. **Migrate Stability provider** (2 hours)  
4. **Migrate Google provider** (2 hours): add Vertex AI client path with `imagegeneration@006`, normalize outputs
5. **Update provider factory** (1 hour)
6. **Test all providers work consistently** (30 minutes)

## Testing Strategy
```typescript
// All providers must pass the same test suite
describe('Provider Architecture', () => {
  it('should handle errors consistently across providers', () => {
    // Same test for Replicate, Stability, Gemini
  });
  
  it('should discover capabilities correctly', () => {
    // Same capability discovery logic
  });
  
  it('should timeout consistently', () => {
    // Same timeout behavior across all providers
  });
});
```

## Success Metrics
- **Zero code duplication** across providers
- **100% consistent error handling**
- **All providers pass same test suite**
- **<5 minutes to add new provider**
- **Frontend can discover capabilities dynamically**

## CRITICAL: Why This Blocks Payment System
1. **Cost tracking requires consistent provider interfaces**
2. **Error handling must be uniform for credit refunds**
3. **Capability discovery needed for pricing UI**
4. **Clean architecture essential for maintainability**

## Next Steps After Completion
1. This enables clean error handling across all operations
2. Provides foundation for accurate cost tracking  
3. Sets up proper capability discovery for UI
4. Creates maintainable pattern for future providers

---
**MOVED FROM Phase 3 to Phase 0 - This is foundational work that cannot wait**