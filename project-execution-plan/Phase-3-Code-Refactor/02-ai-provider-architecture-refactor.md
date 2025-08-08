# Task: Refactor AI Provider Architecture

## Priority: 🔴 CRITICAL
**Estimated Time:** 8 hours
**Dependencies:** 
- Phase 3 Task 01 (Extract Page Logic) started
**Owner:** [Assign]

## Problem Statement
Current AI provider implementation has code duplication, inconsistent error handling, and poor abstraction. Multiple providers (Replicate, Stability, Gemini) have different patterns making maintenance difficult.

## Acceptance Criteria
- [ ] Eliminate code duplication across providers
- [ ] Consistent error handling and retry logic
- [ ] Proper capability discovery system
- [ ] Base provider class with shared functionality
- [ ] Configuration-driven model selection
- [ ] Provider-agnostic operation interface

## Current Problems Identified

### 1. Code Duplication
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

### 2. Inconsistent Capabilities
```typescript
// ❌ BAD: Some providers throw, others support
async styleTransfer(prompt: string, styleImageUrl: string): Promise<string> {
    throw new Error("Style transfer is not supported by the Replicate provider.");
}
```

### 3. Hardcoded Models
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
  
  abstract getProviderInfo(): ProviderMetadata;
  abstract getModelInfo(operation: AIOperation): ModelMetadata;
  
  // Shared functionality
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
        
        if (status.isFailed) {
          throw new AIOperationError(
            AIErrorType.PROVIDER_ERROR,
            status.error || 'Operation failed permanently'
          );
        }
        
        await this.delay(intervalMs);
      } catch (error) {
        if (error instanceof AIOperationError) {
          throw error;
        }
        
        // Retry on network errors
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
  
  protected isRetryableError(error: any): boolean {
    return (
      error.code === 'ETIMEDOUT' ||
      error.response?.status >= 500 ||
      error.response?.status === 429
    );
  }
  
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Default implementations that can be overridden
  async generateImage(prompt: string, options?: any): Promise<string> {
    if (!this.supportsOperation('generateImage')) {
      throw new AIOperationError(
        AIErrorType.INVALID_INPUT,
        `${this.getProviderInfo().serviceProvider} does not support image generation`
      );
    }
    return this.executeOperation('generateImage', { prompt, ...options });
  }
  
  async upscaleImage(imageUrl: string): Promise<string> {
    if (!this.supportsOperation('upscaleImage')) {
      throw new AIOperationError(
        AIErrorType.INVALID_INPUT,
        `${this.getProviderInfo().serviceProvider} does not support image upscaling`
      );
    }
    return this.executeOperation('upscaleImage', { imageUrl });
  }
  
  // Abstract method for provider-specific implementation
  protected abstract executeOperation(operation: AIOperation, params: any): Promise<string>;
  
  // Capability discovery
  public supportsOperation(operation: AIOperation): boolean {
    return this.config.supportedOperations.includes(operation);
  }
  
  public getSupportedOperations(): AIOperation[] {
    return [...this.config.supportedOperations];
  }
}
```

### 2. Configuration-Driven Model Management
```typescript
// amplify/functions/providers/config/providerConfigs.ts
export interface ModelConfig {
  id: string;
  version?: string;
  displayName: string;
  modelUrl?: string;
  costMultiplier: number;
  maxRetries: number;
  timeoutMs: number;
}

export interface ProviderConfig {
  name: string;
  serviceProvider: ProviderType;
  apiEndpoint: string;
  supportedOperations: AIOperation[];
  models: Record<AIOperation, ModelConfig>;
  defaultOptions: Record<string, any>;
}

export const REPLICATE_CONFIG: ProviderConfig = {
  name: "Replicate",
  serviceProvider: "replicate",
  apiEndpoint: "https://api.replicate.com/v1/predictions",
  supportedOperations: ['generateImage', 'upscaleImage'],
  models: {
    generateImage: {
      id: "black-forest-labs/flux-1.1-pro-ultra",
      displayName: "Flux 1.1 Pro Ultra",
      modelUrl: "https://replicate.com/black-forest-labs/flux-1.1-pro-ultra",
      costMultiplier: 1.0,
      maxRetries: 3,
      timeoutMs: 60000
    },
    upscaleImage: {
      id: "philz1337x/clarity-upscaler",
      version: "dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e",
      displayName: "Clarity Upscaler",
      modelUrl: "https://replicate.com/philz1337x/clarity-upscaler",
      costMultiplier: 1.5,
      maxRetries: 3,
      timeoutMs: 90000
    }
  },
  defaultOptions: {
    prompt_upsampling: true
  }
};

export const STABILITY_CONFIG: ProviderConfig = {
  name: "Stability AI",
  serviceProvider: "stability",
  apiEndpoint: "https://api.stability.ai/v1",
  supportedOperations: ['generateImage', 'upscaleImage', 'inpaint', 'outpaint'],
  models: {
    generateImage: {
      id: "stable-diffusion-xl-1024-v1-0",
      displayName: "Stable Diffusion XL",
      costMultiplier: 0.8,
      maxRetries: 3,
      timeoutMs: 30000
    },
    // ... other models
  },
  defaultOptions: {
    cfg_scale: 7,
    steps: 30
  }
};
```

### 3. Refactored Provider Implementation
```typescript
// amplify/functions/providers/ReplicateProvider.ts
export class ReplicateProvider extends BaseAIProvider {
  protected config = REPLICATE_CONFIG;
  private replicate: Replicate;
  
  constructor() {
    super();
    this.replicate = new Replicate({ 
      auth: process.env.REPLICATE_API_TOKEN 
    });
  }
  
  getProviderInfo(): ProviderMetadata {
    return {
      serviceProvider: this.config.serviceProvider,
      apiEndpoint: this.config.apiEndpoint
    };
  }
  
  getModelInfo(operation: AIOperation): ModelMetadata {
    const model = this.config.models[operation];
    if (!model) {
      throw new Error(`Operation ${operation} not supported`);
    }
    
    return {
      modelName: model.id,
      modelVersion: model.version,
      serviceProvider: this.config.serviceProvider,
      displayName: model.displayName,
      modelUrl: model.modelUrl
    };
  }
  
  protected async executeOperation(operation: AIOperation, params: any): Promise<string> {
    const modelConfig = this.config.models[operation];
    if (!modelConfig) {
      throw new AIOperationError(
        AIErrorType.INVALID_INPUT,
        `Operation ${operation} not supported by Replicate`
      );
    }
    
    try {
      const prediction = await this.replicate.predictions.create({
        model: modelConfig.id,
        ...(modelConfig.version && { version: modelConfig.version }),
        input: {
          ...this.config.defaultOptions,
          ...params
        }
      });
      
      const result = await this.pollForCompletion(
        () => this.checkReplicatePrediction(prediction.id),
        modelConfig.timeoutMs
      );
      
      return result;
    } catch (error) {
      if (error instanceof AIOperationError) {
        throw error;
      }
      
      throw new AIOperationError(
        AIErrorType.PROVIDER_ERROR,
        `Replicate ${operation} failed: ${error.message}`
      );
    }
  }
  
  private async checkReplicatePrediction(predictionId: string): Promise<PredictionStatus<string>> {
    const prediction = await this.replicate.predictions.get(predictionId);
    
    return {
      isComplete: !['starting', 'processing'].includes(prediction.status),
      isSuccess: prediction.status === 'succeeded',
      isFailed: prediction.status === 'failed',
      result: this.extractReplicateOutput(prediction.output),
      error: prediction.error?.toString()
    };
  }
  
  private extractReplicateOutput(output: any): string {
    if (typeof output === "string") {
      return output;
    } else if (Array.isArray(output) && output.length > 0) {
      return output[0];
    }
    throw new AIOperationError(
      AIErrorType.PROVIDER_ERROR,
      "Unexpected output format from Replicate"
    );
  }
}
```

### 4. Provider Discovery Service
```typescript
// services/providerService.ts
export class ProviderService {
  private providers: Map<string, BaseAIProvider> = new Map();
  
  constructor() {
    this.registerProvider('replicate', new ReplicateProvider());
    this.registerProvider('stability', new StabilityProvider());
    this.registerProvider('gemini', new GeminiProvider());
  }
  
  registerProvider(name: string, provider: BaseAIProvider): void {
    this.providers.set(name, provider);
  }
  
  getProvider(name: string): BaseAIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not found`);
    }
    return provider;
  }
  
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
  
  getProvidersForOperation(operation: AIOperation): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.supportsOperation(operation))
      .map(([name, _]) => name);
  }
  
  async executeOperation(
    providerName: string,
    operation: AIOperation,
    params: any
  ): Promise<string> {
    const provider = this.getProvider(providerName);
    
    if (!provider.supportsOperation(operation)) {
      throw new AIOperationError(
        AIErrorType.INVALID_INPUT,
        `Provider ${providerName} does not support ${operation}`
      );
    }
    
    return provider[operation](params);
  }
}

export const providerService = new ProviderService();
```

### 5. Update Frontend Provider Hook
```typescript
// src/hooks/useAIProviders.ts
export function useAIProviders() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const response = await aiService.getAvailableProviders();
        setProviders(response);
      } catch (error) {
        console.error('Failed to load providers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProviders();
  }, []);
  
  const getProvidersForOperation = useCallback((operation: AIOperation) => {
    return providers.filter(p => p.supportedOperations.includes(operation));
  }, [providers]);
  
  const getBestProviderForOperation = useCallback((operation: AIOperation) => {
    const available = getProvidersForOperation(operation);
    // Logic to select best provider based on cost, speed, quality
    return available.sort((a, b) => a.cost - b.cost)[0];
  }, [getProvidersForOperation]);
  
  return {
    providers,
    loading,
    getProvidersForOperation,
    getBestProviderForOperation
  };
}
```

## Migration Plan
1. **Create base classes and interfaces**
2. **Migrate one provider at a time** (start with Replicate)
3. **Update provider factory** to use new architecture
4. **Update frontend hooks** to use new provider service
5. **Add comprehensive tests** for each provider
6. **Remove old provider implementations**

## Testing Strategy
```typescript
// Test provider capabilities
describe('Provider Architecture', () => {
  it('should discover provider capabilities correctly', () => {
    const replicate = new ReplicateProvider();
    expect(replicate.supportsOperation('generateImage')).toBe(true);
    expect(replicate.supportsOperation('styleTransfer')).toBe(false);
  });
  
  it('should handle unsupported operations gracefully', async () => {
    const replicate = new ReplicateProvider();
    await expect(
      replicate.styleTransfer('test', 'test')
    ).rejects.toThrow(/does not support/);
  });
});
```

## Success Metrics
- Zero code duplication across providers
- Consistent error handling (100% coverage)
- <5 minutes to add new provider
- All providers tested with same test suite
- Frontend can discover capabilities dynamically 

---

## Additional Actions from Repo Audit

### Split metadata from execution for frontend safety
- [ ] Create `src/modelCatalog/` with static metadata used by UI (name, displayName, docs URL)
- [ ] Replace frontend imports of `amplify/functions/providers/*` with `modelCatalog`
- [ ] Keep all provider execution server-side via AppSync only

### Shared error handling and telemetry
- [ ] Add `BaseAIProvider` with normalized error mapping and retry helper
- [ ] Emit Powertools metrics for success/error by provider/operation

### Capability matrix as single source of truth
- [ ] Generate both frontend capability list (for selectors) and server guard rails from the same config