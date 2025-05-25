# Migration Plan - Gradual Component Migration

## Current Status

The refactoring has been set up to support **gradual migration**. The tsconfig.json now supports both paths:
- Old: `@/components/*` → `./components/*`
- New: `@/components/*` → `./src/components/*`

This allows the app to work with components in both locations during migration.

## Components to Migrate

### From `/components/` to `/src/components/`

#### UI Components
- [x] `CustomCompareSlider.tsx` + `.module.css` → `/src/components/ui/` ✅ **COMPLETED**
- [x] `VerticalCompare.tsx` + `.module.css` → `/src/components/ui/` ✅ **COMPLETED**
- [x] `ModelCredits.tsx` + `.module.css` → `/src/components/ui/` ✅ **COMPLETED**
- [ ] `VideoGenerator.tsx`

#### Form Components  
- [ ] `OperationSelector.tsx` + `.module.css`
- [ ] `ProviderSelector.tsx` + `.module.css`
- [ ] `StyleImageSelector.tsx` + `.module.css`

#### Layout Components
- [x] `Layout.tsx` + `.module.css` → `/src/components/layout/` ✅ **COMPLETED**
- [x] `UserPhotos.tsx` → `/src/components/ui/` ✅ **COMPLETED**

#### Hooks (from `/components/ImageOperations/`)
- [ ] `useImageOperation.tsx` → `/src/hooks/`
- [ ] `useUpscaler.tsx` → `/src/hooks/`
- [ ] `useOutpainter.tsx` → `/src/hooks/`

#### Other Components
- [ ] `ImageOperations/ImageGenerator.tsx` + `.module.css`

## Migration Steps for Each Component

1. **Copy** the component to the new location
2. **Update imports** in the component to use new paths
3. **Test** that the component works in the new location
4. **Update all imports** in pages that use this component
5. **Delete** the old component file
6. **Test** the entire app

## Priority Order

1. **High Priority** (Used by many pages):
   - `Layout.tsx`
   - `UserPhotos.tsx`
   
2. **Medium Priority** (Used by specific features):
   - `CustomCompareSlider.tsx`
   - `VerticalCompare.tsx`
   - `ModelCredits.tsx`
   - `ProviderSelector.tsx`
   - `OperationSelector.tsx`
   
3. **Low Priority** (Can be done last):
   - `VideoGenerator.tsx`
   - `StyleImageSelector.tsx`
   - `ImageOperations/*`

## After Migration

Once all components are migrated:

1. Remove the old path from tsconfig.json:
   ```json
   "@/components/*": [
     "./src/components/*"  // Keep only this
   ]
   ```

2. Delete the empty `/components/` directory

3. Run full test suite

## Benefits of Gradual Migration

- ✅ App remains functional during migration
- ✅ Can migrate one component at a time
- ✅ Easy to rollback if issues arise
- ✅ Can test each migration independently 