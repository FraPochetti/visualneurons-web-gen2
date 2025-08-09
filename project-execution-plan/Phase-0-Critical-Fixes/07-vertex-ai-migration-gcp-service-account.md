# Task: Migrate Google Image Ops to Vertex AI with Service Account

## Priority: 🔴 CRITICAL - Phase 0
Estimated Time: 6–10 hours
Dependencies: Error handling foundation; rate limiting in place
Owner: [Assign]
Status: Planned

## Context
The current Google integration uses the deprecated `gemini-2.0-flash-exp-image-generation` model via API key. We will migrate image generation/editing to Vertex AI (Imagen family, `imagegeneration@006`) using a GCP Service Account JSON, which is the recommended cross‑cloud authentication pattern from AWS Lambda.

## Goals
- Replace deprecated model usage
- Adopt secure service‑account authentication for Vertex AI
- Maintain backward compatibility briefly (API‑key fallback), then remove
- Preserve UI contract (return data URI string)

## Deliverables
- Vertex‑enabled provider path with `@google-cloud/vertexai`
- Secrets added: `GCP_SERVICE_ACCOUNT_JSON` (required), `GCP_VERTEX_LOCATION` (optional), keep `GCP_API_TOKEN` as temporary fallback
- Updated docs (`CLAUDE.md`, `README.md`)
- Observability: log model, region, and latency

## Implementation Steps
1. Secrets and IAM
   - Create GCP Service Account with role `Vertex AI User`
   - Create key (JSON) and store as Amplify secret `GCP_SERVICE_ACCOUNT_JSON`
   - Optionally set `GCP_VERTEX_LOCATION` (default `us-central1`/`europe-west1`)

2. Dependencies
   - Add `@google-cloud/vertexai` to the Lambda function package

3. Provider Adaptation
   - In `amplify/functions/providers/geminiProvider.ts`:
     - Detect presence of `GCP_SERVICE_ACCOUNT_JSON`; if present, initialize Vertex client with parsed JSON
     - Use model `imagegeneration@006` for `generateImage` and image editing
     - Normalize response parsing to return `data:<mime>;base64,<data>` for both Vertex (`fileData`) and legacy (`inlineData`) paths
     - Update `getModelInfo` to report Imagen when Vertex path is active

4. Dispatcher/Infra
   - In `amplify/functions/aiDispatcher/resource.ts`, inject `GCP_SERVICE_ACCOUNT_JSON` and optional `GCP_VERTEX_LOCATION`
   - Ensure Lambda/AppSync timeouts are sufficient (image ops can take 10–30s)

5. Observability & Errors
   - Add structured logs for provider, model, region, and execution time
   - Normalize error messages for UI consumption

6. QA & Rollout
   - Golden prompts for regression testing (5–10 prompts)
   - Validate inpainting/editing flow parity
   - Rollout behind a feature flag; enable Vertex by default after validation
   - Remove API‑key path and `GCP_API_TOKEN` after stabilization

## Acceptance Criteria
- Image generation and inpainting succeed via Vertex with `imagegeneration@006`
- Output remains a data URI compatible with existing UI
- No direct usage of deprecated `gemini-2.0-flash-exp-image-generation`
- Secrets managed only in Amplify; no local `.env`
- Logs include provider, model, region, and latency

## Risks & Mitigations
- Latency/timeouts → increase function timeouts; consider async job for long edits later
- Secret formatting (newlines in private key) → normalize before client init
- Quotas/pricing → monitor with existing rate limiting and planned cost tracking


