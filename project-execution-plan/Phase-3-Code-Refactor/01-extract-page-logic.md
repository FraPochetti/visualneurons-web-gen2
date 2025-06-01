# Task: Extract Business Logic from Pages to Custom Hooks

## Priority: 🟡 HIGH
**Estimated Time:** 10 hours
**Dependencies:** 
- CSS Architecture complete (Phase 2)
**Owner:** [Assign]

## Problem Statement
Pages contain too much business logic, state management, and API calls. This violates React best practices and makes code hard to test and maintain.

## Acceptance Criteria
- [ ] Pages only handle routing and layout
- [ ] All business logic moved to custom hooks
- [ ] Proper separation of concerns
- [ ] Improved testability
- [ ] Consistent patterns across all pages

## Technical Implementation

### 1. Current Problem Example
```tsx
// ❌ BAD: pages/generate-image.tsx (current)
export default function GenerateImage() {
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState("replicate");
  const [loading, setLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(0);
  
  useEffect(() => {
    // Fetch credits
    fetchUserCredits().then(setCredits);
  }, []);
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Check credits
      const cost = await getOperationCost(provider, "generateImage");
      if (credits < cost) {
        setError("Insufficient credits");
        setLoading(false);
        return;
      }
      
      // Generate image
      const response = await generateImage({
        prompt,
        provider,
      });
      
      setGeneratedImageUrl(response.imageUrl);
      setCredits(credits - cost);
      
      // Save to gallery
      await saveImageToGallery(response.imageUrl);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // ... 200 more lines of JSX and logic ...
}
```

### 2. Refactored Solution
```tsx
// ✅ GOOD: hooks/useImageGeneration.ts
export function useImageGeneration() {
  const [state, dispatch] = useReducer(imageGenerationReducer, initialState);
  const { credits, refreshCredits } = useCredits();
  const { saveImage } = useGallery();
  
  const generateImage = useCallback(async (params: GenerateImageParams) => {
    dispatch({ type: 'GENERATE_START' });
    
    try {
      // Validate inputs
      const validation = validateGenerateParams(params);
      if (!validation.isValid) {
        throw new ValidationError(validation.error);
      }
      
      // Check credits
      const cost = await getOperationCost(params.provider, 'generateImage');
      if (credits < cost) {
        throw new InsufficientCreditsError(cost, credits);
      }
      
      // Generate image
      const result = await api.generateImage(params);
      
      // Save to gallery
      await saveImage({
        url: result.imageUrl,
        metadata: {
          prompt: params.prompt,
          provider: params.provider,
          generatedAt: new Date().toISOString()
        }
      });
      
      // Refresh credits
      await refreshCredits();
      
      dispatch({ 
        type: 'GENERATE_SUCCESS', 
        payload: result 
      });
      
      return result;
    } catch (error) {
      dispatch({ 
        type: 'GENERATE_ERROR', 
        payload: error.message 
      });
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
      // Hook already handles error state
    }
  };
  
  return (
    <Layout>
      <PageHeader title="Generate Image" />
      <GenerateImageForm
        onSubmit={handleSubmit}
        loading={loading}
        credits={credits}
      />
      {error && (
        <ErrorAlert 
          error={error} 
          onDismiss={resetError}
        />
      )}
      {generatedImage && (
        <GeneratedImageDisplay image={generatedImage} />
      )}
    </Layout>
  );
}
```

### 3. Create Reducer for Complex State
```typescript
// reducers/imageGenerationReducer.ts
interface ImageGenerationState {
  loading: boolean;
  error: string | null;
  generatedImage: GeneratedImage | null;
  history: GeneratedImage[];
}

type ImageGenerationAction =
  | { type: 'GENERATE_START' }
  | { type: 'GENERATE_SUCCESS'; payload: GeneratedImage }
  | { type: 'GENERATE_ERROR'; payload: string }
  | { type: 'RESET_ERROR' }
  | { type: 'CLEAR_IMAGE' };

export function imageGenerationReducer(
  state: ImageGenerationState,
  action: ImageGenerationAction
): ImageGenerationState {
  switch (action.type) {
    case 'GENERATE_START':
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case 'GENERATE_SUCCESS':
      return {
        ...state,
        loading: false,
        generatedImage: action.payload,
        history: [action.payload, ...state.history].slice(0, 10)
      };
      
    case 'GENERATE_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    case 'RESET_ERROR':
      return {
        ...state,
        error: null
      };
      
    case 'CLEAR_IMAGE':
      return {
        ...state,
        generatedImage: null
      };
      
    default:
      return state;
  }
}
```

### 4. Create Reusable Form Components
```tsx
// components/form/GenerateImageForm.tsx
interface GenerateImageFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  loading?: boolean;
  credits?: number;
}

export const GenerateImageForm = memo<GenerateImageFormProps>(({ 
  onSubmit, 
  loading, 
  credits 
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const { providers, costs } = useAIProviders();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };
  
  const currentCost = costs[formData.provider]?.generateImage || 0;
  const canAfford = credits !== undefined ? credits >= currentCost : true;
  
  return (
    <form onSubmit={handleSubmit} className="generate-form">
      <div className="form-group">
        <label htmlFor="prompt" className="form-label">
          Describe your image
        </label>
        <textarea
          id="prompt"
          value={formData.prompt}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            prompt: e.target.value 
          }))}
          className="form-input"
          rows={4}
          placeholder="A futuristic city at sunset..."
          required
          disabled={loading}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="provider" className="form-label">
          AI Provider
        </label>
        <select
          id="provider"
          value={formData.provider}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            provider: e.target.value as AIProvider
          }))}
          className="form-input"
          disabled={loading}
        >
          {providers.map(provider => (
            <option key={provider.id} value={provider.id}>
              {provider.name} ({costs[provider.id]?.generateImage || 0} credits)
            </option>
          ))}
        </select>
      </div>
      
      {credits !== undefined && (
        <CreditDisplay 
          balance={credits} 
          cost={currentCost}
          sufficient={canAfford}
        />
      )}
      
      <button
        type="submit"
        disabled={loading || !canAfford}
        className="btn btn-primary"
      >
        {loading ? (
          <>
            <Spinner size="sm" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <IconGenerate />
            <span>Generate Image</span>
          </>
        )}
      </button>
    </form>
  );
});

GenerateImageForm.displayName = 'GenerateImageForm';
```

### 5. Create Service Layer
```typescript
// services/aiService.ts
class AIService {
  private client = generateClient<Schema>();
  
  async generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
    const response = await this.client.mutations.generateImage({
      prompt: params.prompt,
      provider: params.provider,
      prompt_upsampling: params.options?.promptUpsampling,
      operation: 'generateImage'
    });
    
    if (!response.data || response.errors) {
      throw new APIError('Failed to generate image', response.errors);
    }
    
    return {
      imageUrl: response.data,
      prompt: params.prompt,
      provider: params.provider,
      timestamp: new Date().toISOString()
    };
  }
  
  async getOperationCost(
    provider: string, 
    operation: string
  ): Promise<number> {
    // Implementation with caching
    const cacheKey = `${provider}:${operation}`;
    const cached = this.costCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
    
    const cost = await this.fetchOperationCost(provider, operation);
    this.costCache.set(cacheKey, {
      value: cost,
      expires: Date.now() + 300000 // 5 minutes
    });
    
    return cost;
  }
}

export const aiService = new AIService();
```

### 6. Pattern for All Pages
Apply the same pattern to all pages:

#### Before:
- `pages/edit-image.tsx` - 150+ lines with mixed concerns
- `pages/style-transfer.tsx` - 180+ lines with duplicated logic
- `pages/dashboard.tsx` - Complex state management inline

#### After:
- `hooks/useImageEdit.ts` - Business logic
- `hooks/useStyleTransfer.ts` - Business logic
- `hooks/useDashboard.ts` - Business logic
- Pages become thin view layers

## Migration Steps
1. **Identify shared logic** across pages
2. **Create base hooks** for common patterns
3. **Extract page by page**, starting with simplest
4. **Create reusable components** for common UI
5. **Add comprehensive error handling**
6. **Write tests** for new hooks
7. **Update documentation**

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
  
  it('should handle insufficient credits', async () => {
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

## Success Metrics
- Pages under 100 lines of code
- 90%+ business logic in hooks/services
- Zero duplicate API calls
- All hooks unit tested
- Consistent error handling

## Next Steps
1. Create state management layer (Context API)
2. Implement proper TypeScript types
3. Add error boundaries
4. Create hook composition patterns 