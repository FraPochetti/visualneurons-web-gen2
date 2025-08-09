# Visual Neurons Web App - REVISED Execution Plan & Progress Tracker

## 🎯 Project Goals
- Build a FAANG-level web app for AI-powered image editing
- Implement a robust payment/credit system to prevent bankruptcy
- Create a modern, centralized CSS architecture
- Deliver exceptional user experience with proper error handling

## 📊 Current Critical Issues (PRIORITIZED)
1. **URGENT: Incomplete Phase 0** - Critical stability missing (error handling, monitoring)
2. **No payment system** - Users have unlimited access to expensive AI APIs
3. **Poor code architecture** - AI providers have duplicate code, pages have business logic
4. **CSS scattered everywhere** - Violates core project guideline
5. **No comprehensive testing** - High risk for production issues
6. **Client/Server separation breach** - Frontend imports server-only provider classes (`amplify/functions/providers/*`), risking bundle bloat and secret leakage
7. **Unsecured media endpoint** - `resizeImage` Lambda uses a public Function URL without auth; needs request signing/token

## 🚀 REVISED Execution Phases (12-14 weeks total)

### Phase 0: Critical Stability Foundation (Week 1-2) 🔴 URGENT
**Goal:** Complete application stability before ANY new features
- [x] **Emergency rate limiting** ✅ **COMPLETED** - 10 operations/hour limit active
- [~] **PRIORITY 1: Comprehensive error handling** — Core delivered (typed GraphQL responses, UI error adapter with details toggle, friendly messages in hooks/pages).
- [x] **PRIORITY 1b: GraphQL error normalization** — Implemented via `OperationResponse` structure returned by all AI mutations.
- [~] **PRIORITY 2: Real cost monitoring** - Cost metric emitted from backend; dashboard/alarms next
- [~] **PRIORITY 2c: In-app usage ledger** — Added OperationLog model, pricing registry, My Usage page (filters, CSV, daily totals). Next: server-side pagination/aggregates.
- [x] **PRIORITY 2b: Secure media processing endpoints** - `resizeImage` URL set to AWS_IAM; `aiDispatcher` invokes the function directly with IAM
- [ ] **PRIORITY 3: AI provider architecture refactor** - Eliminate code duplication
- [ ] **PRIORITY 3b: Google → Vertex AI migration** - Service account auth, `imagegeneration@006`, API‑key fallback during transition
- [ ] ~~**PRIORITY 4: Complete usage caps system** - Build on rate limiting foundation~~
- [x] Deferred: app is not public; will launch with payment/credits, making this redundant
- [ ] **PRIORITY 5: Production monitoring setup** - CloudWatch dashboards, alerts

### Phase 1: Clean Architecture Foundation (Week 3-4)
**Goal:** Establish FAANG-level code patterns before building payment system
- [ ] Extract all business logic from pages to custom hooks
- [x] Split provider metadata from execution code - created client-safe `src/modelCatalog` and removed frontend imports of server provider classes
- [ ] Implement proper service layer abstractions  
- [ ] Add comprehensive TypeScript types and interfaces
- [ ] Create error boundaries and proper error handling patterns
- [ ] Implement proper state management (Context API)
- [ ] Add unit tests for all business logic

### Phase 2: Payment & Credits System (Week 5-8) 
**Goal:** Implement complete billing infrastructure with proper migration
- [ ] Design and implement credit system data model
- [ ] **NEW: Create user migration strategy** for existing accounts
- [ ] Integrate Stripe payment processing with proper webhook infrastructure
- [ ] Build credit management Lambda functions with proper error handling
- [ ] **NEW: Implement rollback strategies** for payment failures
- [ ] Add comprehensive payment flow testing
- [ ] Create free tier with proper limits
- [ ] **NEW: PCI compliance review** and security audit

### Phase 3: User Experience & Interface (Week 9-10)
**Goal:** Build intuitive user interface for the credit system
- [ ] Build credit balance dashboard with real-time updates
- [ ] Create onboarding flow for new users
- [ ] Add operation cost previews before execution
- [ ] Implement proper loading states and progress indicators
- [ ] Design usage analytics and history pages
- [ ] Add user settings and preferences management

### Phase 4: CSS Architecture & Polish (Week 11-12)
**Goal:** Centralize styling AFTER core functionality is stable
- [ ] Create comprehensive design system with tokens
- [ ] **REVISED: Gradual migration** from .module.css files (no big bang)
- [ ] Implement CSS variables and utility classes
- [ ] Build component library with consistent styling
- [ ] Add dark mode support
- [ ] **NEW: Visual regression testing** to prevent style breakage

### Phase 5: Testing, Performance & Production (Week 13-14)
**Goal:** Ensure production readiness with comprehensive testing
- [ ] Write integration tests for all critical user flows
- [ ] Add comprehensive payment flow testing with Stripe test mode
- [ ] Optimize bundle size and performance metrics
- [ ] Create comprehensive deployment documentation
- [ ] Set up production monitoring and alerting
- [ ] **NEW: Load testing** for concurrent payment processing
- [ ] **NEW: Disaster recovery planning** and procedures

## 📈 REVISED Progress Tracking

### Completion Status
- Phase 0: 45% ✅✅✅⬜⬜ (Rate limiting done; error handling core delivered; cost metric + secure resize done; remaining: dashboard/alarms, retry util, provider refactor, monitoring)
- Phase 1: 0% ⬜⬜⬜⬜⬜ (Cannot start until Phase 0 complete)
- Phase 2: 0% ⬜⬜⬜⬜⬜ (Cannot start until Phase 1 complete)
- Phase 3: 0% ⬜⬜⬜⬜⬜
- Phase 4: 0% ⬜⬜⬜⬜⬜
- Phase 5: 0% ⬜⬜⬜⬜⬜

### Key Metrics to Track
- [x] **API costs per day** - Now protected with 10/hour rate limits ✅
- [ ] **NEW: Actual API cost tracking** (not estimates)
- [ ] Error rate reduction to <2%
- [ ] Credit purchase conversion rate
- [ ] Page load time improvement to <3s
- [ ] **NEW: Payment success rate** >98%
- [ ] **NEW: Code test coverage** >80%
- [ ] **NEW: Unauthorized calls to function URLs** = 0 (CloudWatch alarm)

## 🔍 REVISED Success Criteria
1. **100% Phase 0 completion** - No Phase 1 work until stability complete
2. **Zero unauthorized API usage** - All operations require credits
3. **<2% error rate** - Comprehensive error handling throughout
4. **>98% payment success rate** - Robust payment processing
5. **Single source of styling truth** - Gradual CSS centralization
6. **<3s page load time** - Optimized performance
7. **>80% code coverage** - Comprehensive testing

## 🚨 CRITICAL DEPENDENCIES & BLOCKERS
1. **BLOCKER: Phase 0 incomplete** - Must finish before Phase 1
2. **MISSING: User migration strategy** - How to handle existing users
3. **MISSING: Real API cost tracking** - Currently using rough estimates
4. **MISSING: Stripe webhook infrastructure** - Not properly documented
5. **MISSING: Testing strategy** - No plan for payment flow testing
6. **MISSING: Production deployment strategy** - Beyond sandbox testing
7. **BLOCKER: Client bundles server provider code** - Must separate provider metadata to prevent bundling secrets/heavy deps

## 📝 REVISED Implementation Rules
1. **NO Phase advancement until previous phase 100% complete**
2. **NO CSS removal until Phase 4** - Gradual migration only
3. **ALL payment changes require rollback strategy**
4. **ALL new features require comprehensive error handling**
5. **NO production deployment without monitoring setup**
6. **Weekly progress reviews with timeline adjustments**

## ⏰ REALISTIC TIMELINE EXPECTATIONS
- **Phase 0: 2 weeks** (not 2-3 days) - Complex AWS integrations
- **Phase 1: 2 weeks** - Clean architecture is foundational  
- **Phase 2: 4 weeks** - Payment systems are complex, need proper testing
- **Phase 3: 2 weeks** - UI work builds on payment foundation
- **Phase 4: 2 weeks** - CSS migration needs to be careful
- **Phase 5: 2 weeks** - Production readiness cannot be rushed
- **TOTAL: 14 weeks** with built-in buffers for unexpected issues

---
Last Updated: **Aug 2025** - Phase 0 Task 02 core delivered; client-safe model catalog added; hosting build green.