# Task: Model Catalog and Frontend Decoupling from Providers

## Priority: 🟡 HIGH - Phase 1
- Estimated Time: 6 hours
- Dependencies: Phase 0 completed (error handling, monitoring, provider refactor basics)
- Owner: [Assign]

## Problem
Frontend components import server provider classes from `amplify/functions/providers/*` to query `getModelInfo`. This breaches client/server separation, risks bundling server dependencies, and complicates payments.

## Goal
Provide a client-safe catalog of provider/operation metadata for UI display and selection, while keeping all provider execution server-side behind AppSync.

## Deliverables
- `src/modelCatalog/index.ts`: static metadata per provider/operation
- `src/modelCatalog/types.ts`: types for model metadata
- Replace all usages of `createProvider().getModelInfo()` in pages/components with `modelCatalog`
- Capability map consumed by `ProviderSelector`/`OperationSelector`

## Steps
1) Create `src/modelCatalog` with entries:
```ts
export const modelCatalog = {
  replicate: {
    generateImage: { displayName: 'Flux 1.1 Pro Ultra', docsUrl: 'https://replicate.com/...' },
    upscaleImage: { displayName: 'Clarity Upscaler', docsUrl: 'https://replicate.com/...' }
  },
  stability: {
    styleTransfer: { displayName: 'Style Transfer', docsUrl: 'https://stability.ai/...' },
    outpaint: { displayName: 'Outpaint', docsUrl: 'https://stability.ai/...' }
  },
  gemini: {
    generateImage: { displayName: 'Gemini 2.0 Flash (exp)', docsUrl: 'https://developers.google.com/genai/gemini' }
  }
} as const;
```
2) Update `ProviderSelector` and `OperationSelector` to derive capabilities from `modelCatalog`
3) Update `pages/generate-image.tsx`, `pages/edit-image.tsx`, `pages/style-transfer.tsx` to read metadata from `modelCatalog`
4) Ensure no frontend imports from `amplify/functions/providers/*`

## Acceptance Criteria
- Zero frontend imports from server provider files
- UI still shows model names/links correctly
- Capability filtering works as before
- Tree-shaking reduces client bundle size

## Notes
- Keep provider execution and secret usage strictly in Lambda
- This is a prerequisite for payment flows and pricing displays
