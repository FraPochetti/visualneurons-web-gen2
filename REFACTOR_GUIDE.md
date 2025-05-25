# Refactoring Guide - FAANG-Level Architecture

## Overview
This document outlines the architectural improvements made to achieve FAANG-level code quality while maintaining Amplify Gen 2 compatibility.

## New Project Structure

```
├── amplify/                    # ← UNCHANGED (Amplify Gen 2 requirement)
├── pages/                      # ← UNCHANGED (Next.js requirement)  
├── src/                        # ← NEW: All frontend logic
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── PhotoGrid.tsx
│   │   └── layout/             # Layout components
│   │       └── Navigation.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useUserPhotos.ts
│   ├── services/               # API calls and business logic
│   │   ├── authService.ts
│   │   └── photoService.ts
│   ├── types/                  # TypeScript definitions
│   │   └── index.ts
│   ├── lib/                    # Utilities and configurations
│   │   ├── logger.ts
│   │   └── errorHandler.ts
│   └── constants/              # App constants
│       └── index.ts
├── public/                     # ← UNCHANGED
└── package.json
```

## Key Improvements

### 1. **Separation of Concerns**
- **Pages**: Thin orchestration layer
- **Hooks**: State management and side effects
- **Services**: API calls and business logic
- **Components**: Pure UI components

### 2. **Type Safety**
- Comprehensive TypeScript interfaces
- Strict type checking enabled
- No `any` types allowed

### 3. **Error Handling**
- Centralized error handling with `AppError` class
- Error boundaries for React components
- Proper logging with context

### 4. **Performance Optimizations**
- `React.memo` for expensive components
- `useCallback` and `useMemo` where appropriate
- Lazy loading for images

### 5. **Code Quality**
- ESLint rules enforcing best practices
- No console statements in production
- Consistent naming conventions

## Migration Guide

### Before (Old Pattern)
```tsx
// pages/dashboard.tsx - BAD
export default function Dashboard() {
  const [photos, setPhotos] = useState([]);
  
  useEffect(() => {
    // Direct API calls in component
    const fetchPhotos = async () => {
      const session = await fetchAuthSession();
      // ... complex logic
    };
    fetchPhotos();
  }, []);

  const handleDelete = async (path) => {
    // Business logic in component
    await remove({ path });
    setPhotos(prev => prev.filter(p => p.path !== path));
  };

  return (
    <div>
      {photos.map(photo => (
        <div key={photo.path}>
          <img src={photo.url} />
          <button onClick={() => handleDelete(photo.path)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### After (New Pattern)
```tsx
// pages/dashboard.tsx - GOOD
export default function Dashboard() {
  const { visiblePhotos, deletePhoto } = useUserPhotos();

  return (
    <ErrorBoundary>
      <div>
        <PhotoGrid photos={visiblePhotos} onDelete={deletePhoto} />
      </div>
    </ErrorBoundary>
  );
}
```

## Usage Examples

### Using Services
```tsx
import { photoService } from '@/src/services/photoService';

// In a hook or component
const photos = await photoService.fetchUserPhotos();
```

### Using Hooks
```tsx
import { useUserPhotos } from '@/src/hooks/useUserPhotos';

function MyComponent() {
  const { photos, loading, error, deletePhoto } = useUserPhotos();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;
  
  return <PhotoGrid photos={photos} onDelete={deletePhoto} />;
}
```

### Error Handling
```tsx
import { handleError } from '@/src/lib/errorHandler';

try {
  await someAsyncOperation();
} catch (error) {
  const appError = handleError(error, { context: 'user-action' });
  // Error is automatically logged
  throw appError;
}
```

## Best Practices

### 1. **Component Design**
- Keep components small and focused
- Use TypeScript interfaces for props
- Implement proper error boundaries

### 2. **State Management**
- Use custom hooks for complex state logic
- Keep local state minimal
- Prefer derived state over stored state

### 3. **API Calls**
- Always use service classes
- Implement proper error handling
- Add loading and error states

### 4. **Performance**
- Use `React.memo` for expensive renders
- Implement proper dependency arrays
- Lazy load images and components

### 5. **Testing Strategy**
```bash
# TODO: Add testing setup
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

## Next Steps

1. **Add Unit Tests**: Implement Jest + React Testing Library
2. **Add Integration Tests**: Test complete user flows
3. **Performance Monitoring**: Add metrics and monitoring
4. **Accessibility**: Ensure WCAG compliance
5. **Internationalization**: Add i18n support

## Amplify Gen 2 Constraints

### What You CANNOT Change
- `amplify/` directory structure
- `pages/` directory (Next.js requirement)
- `amplify_outputs.json` location

### What You CAN Change
- All frontend code organization
- Component structure
- State management patterns
- Utility functions

## Commands

```bash
# Development
npm run dev

# Linting (now with strict rules)
npm run lint

# Build
npm run build

# Type checking
npx tsc --noEmit
```

This refactoring maintains full Amplify Gen 2 compatibility while achieving enterprise-level code quality standards. 