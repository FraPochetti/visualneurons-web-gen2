# Task: Extract Business Logic from Pages to Custom Hooks

## Priority: 🟡 HIGH
**Estimated Time:** 12 hours (revised upward - more complex than initially estimated)  
**Dependencies:** Phase 0 must be 100% complete
**Owner:** [Assign]
**Status:** ⏳ **BLOCKED** - Cannot start until Phase 0 complete

## Problem Statement
Pages contain too much business logic, state management, and API calls. This violates React best practices and makes code hard to test and maintain. Before building the payment system, we need clean separation of concerns.

## WHY THIS IS NOW PHASE 1 (MOVED FROM PHASE 3)
Clean architecture must be established **before** building the payment system because:
1. Payment logic will be complex and needs proper separation
2. Credit checking hooks need clean patterns to follow
3. Error handling patterns must be consistent
4. Testing is much easier with separated business logic

## Acceptance Criteria
- [ ] Pages only handle routing and layout (no business logic)
- [ ] All business logic moved to custom hooks
- [ ] Proper separation of concerns established
- [ ] Improved testability for all operations
- [ ] Consistent patterns across all pages
- [ ] Foundation ready for payment system integration

## Current State (repo audit)
- Hooks exist for upscaling and outpainting: `src/hooks/useUpscaler.ts`, `src/hooks/useOutpainter.ts`, `src/hooks/useImageOperation.ts`
- Pages still import server provider classes for metadata (e.g., `createProvider().getModelInfo`)
- Logging via `src/lib/logger.ts` present; `ErrorBoundary` implemented

## Tasks
- [ ] Create `src/modelCatalog/index.ts` with model metadata for UI
- [ ] Replace page/component usages of `createProvider().getModelInfo` with `modelCatalog`
- [ ] Centralize error adaptation in `src/lib/errorAdapter.ts` used by hooks/pages
- [ ] Ensure all page business logic is in hooks/services (pages only compose UI)

## Current Problem Example
```tsx
// ❌ BAD: pages/generate-image.tsx (current)
export default function GenerateImage() {
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState("replicate");
  const [loading, setLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(0);
  
  // 200+ lines of mixed business logic and UI
  // API calls mixed in with state management
  // Error handling scattered throughout
  // No separation of concerns
}
```

## Refactored Solution
```tsx
// ✅ GOOD: hooks/useImageGeneration.ts
export function useImageGeneration() {
  const [state, dispatch] = useReducer(imageGenerationReducer, initialState);
  const { credits, refreshCredits } = useCredits();
  const { saveImage } = useGallery();
  
  const generateImage = useCallback(async (params: GenerateImageParams) => {
    dispatch({ type: 'GENERATE_START' });
    
    try {
      // Clean validation
      const validation = validateGenerateParams(params);
      if (!validation.isValid) {
        throw new ValidationError(validation.error);
      }
      
      // Credit checking (ready for Phase 2 payment system)
      const cost = await getOperationCost(params.provider, 'generateImage');
      if (credits < cost) {
        throw new InsufficientCreditsError(cost, credits);
      }
      
      // Clean API call
      const result = await api.generateImage(params);
      
      // Consistent success handling
      dispatch({ type: 'GENERATE_SUCCESS', payload: result });
      await refreshCredits();
      
      return result;
    } catch (error) {
      // Consistent error handling
      dispatch({ type: 'GENERATE_ERROR', payload: error.message });
      throw error;
    }
  }, [credits, refreshCredits, saveImage]);
  
  return {
    ...state,
    generateImage,
    credits,
    resetError: () => dispatch({ type: 'RESET_ERROR' })
  };
}

// ✅ GOOD: pages/generate-image.tsx (refactored)
export default function GenerateImage() {
  const {
    loading,
    error,
    generatedImage,
    credits,
    generateImage,
    resetError
  } = useImageGeneration();
  
  const handleSubmit = async (formData: FormData) => {
    try {
      await generateImage({
        prompt: formData.prompt,
        provider: formData.provider,
        options: formData.options
      });
    } catch (error) {
      // Hook handles error state
    }
  };
  
  return (
    <Layout>
      <PageHeader title="Generate Image" />
      <GenerateImageForm onSubmit={handleSubmit} loading={loading} />
      {error && <ErrorAlert error={error} onDismiss={resetError} />}
      {generatedImage && <GeneratedImageDisplay image={generatedImage} />}
    </Layout>
  );
}
```

## Implementation Strategy

### 1. Create Hook Patterns (4 hours)
```typescript
// Base patterns that will be reused in payment system
interface BaseOperationState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

type BaseOperationAction<T> =
  | { type: 'START' }
  | { type: 'SUCCESS'; payload: T }
  | { type: 'ERROR'; payload: string }
  | { type: 'RESET' };

// Reusable reducer pattern
function createOperationReducer<T>() {
  return (state: BaseOperationState<T>, action: BaseOperationAction<T>) => {
    switch (action.type) {
      case 'START': return { ...state, loading: true, error: null };
      case 'SUCCESS': return { loading: false, error: null, data: action.payload };
      case 'ERROR': return { ...state, loading: false, error: action.payload };
      case 'RESET': return { ...state, error: null };
      default: return state;
    }
  };
}
```

### 2. Service Layer Architecture (4 hours)  
```typescript
// Clean service layer that payment system will use
class AIService {
  private client = generateClient<Schema>();
  
  async generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
    const response = await this.client.mutations.generateImage({
      prompt: params.prompt,
      provider: params.provider,
      operation: 'generateImage'
    });
    
    if (!response.data || response.errors) {
      throw new APIError('Failed to generate image', response.errors);
    }
    
    return this.transformResponse(response.data);
  }
  
  // Consistent error handling that payment system will inherit
  private handleError(error: any): never {
    if (error.errors?.some(e => e.message.includes('RATE_LIMIT'))) {
      throw new RateLimitError(error.errors[0].message);
    }
    if (error.errors?.some(e => e.message.includes('INSUFFICIENT_CREDITS'))) {
      throw new InsufficientCreditsError(error.errors[0].message);
    }
    throw new APIError(error.message);
  }
}
```

### 3. Page Refactoring Order (4 hours)
1. **Start with simplest**: `pages/dashboard.tsx` (mostly UI)
2. **Generate image page**: Extract to `useImageGeneration`
3. **Edit image pages**: Extract to `useImageEditor`
4. **Style transfer**: Extract to `useStyleTransfer`
5. **Gallery/history**: Extract to `useGallery`

## Testing Strategy
```typescript
// __tests__/hooks/useImageGeneration.test.ts
describe('useImageGeneration', () => {
  it('should handle successful generation', async () => {
    const { result } = renderHook(() => useImageGeneration());
    
    await act(async () => {
      await result.current.generateImage({
        prompt: 'test prompt',
        provider: 'replicate'
      });
    });
    
    expect(result.current.generatedImage).toBeDefined();
    expect(result.current.error).toBeNull();
  });
  
  it('should handle insufficient credits (ready for Phase 2)', async () => {
    mockCredits(0);
    const { result } = renderHook(() => useImageGeneration());
    
    await expect(
      result.current.generateImage({
        prompt: 'test',
        provider: 'replicate'
      })
    ).rejects.toThrow(InsufficientCreditsError);
  });
});
```

## Migration Steps
1. **Create base hook patterns** (reusable for payment system)
2. **Extract simplest page first** (dashboard)
3. **Create shared service layer** (AI operations)
4. **Migrate complex pages one by one**
5. **Add comprehensive tests** for all hooks
6. **Document patterns** for Phase 2 payment development

## Success Metrics
- **Pages under 100 lines** (currently 200-300 lines)
- **90%+ business logic in hooks/services**
- **Zero duplicate API calls**
- **All hooks unit tested** (>80% coverage)
- **Consistent error handling patterns**
- **Clean foundation for payment system**

## How This Enables Phase 2 (Payment System)
1. **Clean credit checking patterns** established
2. **Consistent error handling** for payment failures
3. **Service layer ready** for credit deduction
4. **Testable business logic** for complex payment flows
5. **Separation of concerns** for payment UI components

## CRITICAL: Phase 0 Dependencies
This task **cannot start** until Phase 0 is complete because:
1. **Error handling patterns** must be established first
2. **AI provider architecture** must be clean for service layer
3. **Cost monitoring** needed for accurate credit calculations

---
**MOVED FROM Phase 3 to Phase 1 - Foundation must be clean before payment system**