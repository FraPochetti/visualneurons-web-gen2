# Task: Secure Media Processing Endpoints (resize Lambda)

## Priority: 🔴 CRITICAL - Phase 0
- Estimated Time: 4 hours
- Dependencies: None
- Owner: [Assign]

## Problem
`resizeImage` Lambda is exposed via a public Function URL with `authType: NONE` and no request authentication. This is a potential abuse vector (free image processing) and could be used in chained attacks during paid flows.

## Current State (repo)
- Function defined in `amplify/functions/resizeImage/resource.ts`
- Function URL added in `amplify/backend.ts` with `FunctionUrlAuthType.NONE`
- Provider `StabilityProvider.outPaint` calls this URL from server-side Lambda

## Goals
- Only allow authorized callers (our backend Lambda) to invoke the resize function
- Prevent public abuse and add observability + throttling

## Options
- Change Function URL auth to `AWS_IAM` and use SigV4 from caller Lambda
- Keep `NONE` but require an HMAC signature or shared token header validated in the Python handler

## Implementation (recommended: AWS_IAM)
1) Update backend to require IAM auth
- Change `authType` to `AWS_IAM`
- Grant `aiDispatcher` Lambda `lambda:InvokeFunctionUrl` on the resize Lambda

2) Update Stability provider call path
- Use AWS SDK to call `invokeFunctionUrl` with SigV4 (or switch to `invoke` payload)

3) Add throttling and metrics
- Configure reserved concurrency for resize function
- Emit CloudWatch metrics and alarms for 4XX/5XX spikes

## Alternative (HMAC header) if `AWS_IAM` not feasible
1) Generate a secret in Amplify: `RESIZE_HMAC_SECRET`
2) Add header `x-resize-signature` from caller Lambda: `HMAC_SHA256(body, secret)`
3) Validate signature in `handler.py` before processing
4) Return 401 on invalid/missing signature

## Acceptance Criteria
- Public requests to Function URL are unauthorized
- Only our backend Lambda successfully invokes the function
- Alarms configured for anomalous traffic/errors
- No regressions in outpaint flow

## Rollback
- Temporarily re-enable `NONE` with token validation until IAM/SigV4 path is stable
