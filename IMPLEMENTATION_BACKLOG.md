# SafeScan Implementation Backlog

## Purpose

This backlog translates `IMPLEMENTATION_PLAN.md` into concrete implementation work for a React frontend and .NET backend.

It assumes:
- frontend and backend can be built now
- DABAS API access is not yet available
- backend must use static placeholder data behind the final API contracts
- switching to live DABAS later must not require frontend contract changes

---

## Working Agreements

- Canonical app name: `SafeScan`
- Canonical saved-items nav label: `Favorites`
- Frontend integrates with backend contracts from day one
- Backend provides placeholder data provider until DABAS API key arrives
- Search is part of the primary experience, not an afterthought
- Monorepo layout:
  - frontend root: `/src/frontend`
  - backend root: `/src/backend`

---

## Phase 0 - Contracts and Foundations

### Frontend
- Create design token map from the mockups and `stitch/vital_market/DESIGN.md`
- Define route map for onboarding, scan, search results, product results, favorites, profile, and history
- Define TypeScript DTOs matching backend contracts
- Create frontend workspace under `/src/frontend`

### Backend
- Create solution structure for API, application, domain, infrastructure, and provider layers
- Create backend workspace under `/src/backend`
- Define normalized DTOs for:
  - `Allergen`
  - `UserAllergyProfile`
  - `Product`
  - `AnalysisResult`
  - `SearchResult`
- Define provider abstraction for:
  - GTIN lookup
  - free-text search
  - product detail hydration
  - lightweight search-result enrichment

### Acceptance criteria
- Shared contracts are documented and stable
- Placeholder provider can be swapped for DABAS provider later

---

## Phase 1 - Backend Skeleton with Placeholder Data

### Tasks
- Scaffold ASP.NET Core Web API project
- Add Swagger/OpenAPI
- Implement config-driven provider selection
- Implement static placeholder provider backed by fixture files or in-memory repositories
- Add placeholder data for:
  - onboarding allergen list
  - search results
  - safe product example
  - caution product example
  - warning product example
- Expose endpoints:
  - `GET /api/products/gtin/{gtin}`
  - `GET /api/products/search?q={query}`
  - `POST /api/analysis`

### Acceptance criteria
- API runs locally
- Swagger works
- Search and GTIN lookup return normalized placeholder responses
- Analysis endpoint returns stable safe/caution/warning outputs

---

## Phase 2 - Frontend App Shell

### Tasks
- Scaffold React + TypeScript + Vite app
- Add routing
- Add PWA setup
- Add shared layout shell
- Implement top app bar and bottom navigation
- Normalize nav to:
  - `Home`
  - `Scan`
  - `Favorites`
  - `Profile`
- Add design tokens as CSS variables
- Add typography setup for `Manrope` and `Inter`

### Acceptance criteria
- App boots cleanly
- Shell visually follows mockups
- Mobile layout and safe areas are handled correctly
- Service worker registers in production builds and exposes a user-facing update prompt when a new version is available

---

## Phase 3 - Onboarding and Profile State

### Tasks
- Build onboarding page from mockup
- Implement multi-select allergen grid
- Add local persistence for user allergy profile
- Support explicit distinction between:
  - `milk_protein`
  - `lactose`
- Add profile-state store/context
- Navigate to scan after save

### Next session checklist
- [x] Create frontend shared DTOs matching backend contracts in `/src/frontend/shared/domain`
- [x] Create frontend API client utilities in `/src/frontend/shared/api`
- [x] Fetch allergen options from `GET /api/reference/allergens`
- [x] Replace onboarding placeholder chips with real controlled allergen selection UI
- [x] Persist selected allergens to local storage
- [x] Rehydrate saved allergen profile on app load
- [x] Navigate from onboarding to `/scan` after saving a valid profile
- [x] Add component tests for onboarding state and persistence

### Acceptance criteria
- Profile persists across reloads
- Onboarding visually matches mockup intent
- Selected allergens are reused in analysis requests

---

## Phase 4 - Search Experience

### Tasks
- Add inline search field to scanner screen
- Build search results page from updated mockup
- Integrate frontend with `GET /api/products/search`
- Add recent-search persistence
- Support query submission and optional debounce
- Render editorial card-based search results
- Handle:
  - loading
  - empty results
  - error state
  - partial enrichment state

### Next session checklist
- [x] Wire scanner search form to backend `GET /api/products/search?q=...`
- [x] Include selected allergen codes in search requests when available
- [x] Replace static search cards with backend-driven results
- [x] Render loading, empty, and error states in `SearchResultsPage`
- [x] Support partial enrichment rendering when preview fields are missing
- [x] Persist recent searches locally
- [x] Route selected search result to `/results/:gtin`
- [x] Add component tests for search result rendering and empty/error states

### Optional enrichment tasks
- Render `previewStatus`
- Render `previewBadge`
- Render `previewNote`
- Gracefully degrade if those fields are absent

### Acceptance criteria
- User can search from scanner screen
- Search results render from backend placeholder data
- Selecting a result routes into product detail/result flow

---

## Phase 5 - Scanner Experience

### Tasks
- Integrate ZXing on scanner route only
- Implement explicit user-controlled camera launch flow
- Add scanner frame overlay
- Add torch control where supported
- Add scan throttling / duplicate suppression
- Map scanned GTIN into backend product lookup
- Route successful lookup into result flow
- Implement the inactive search-first scanner state from `stitch/scanner_with_search`

### Next session checklist
- [x] Decide barcode library/package version compatible with current frontend stack
- [x] Lazy-load scanner dependencies on the scan route only
- [x] Implement camera permission request and denied-state UI
- [x] Keep the existing inline search experience intact while adding live camera scanning
- [x] Add duplicate scan suppression and cooldown handling
- [x] Route scanned GTINs through backend lookup instead of local mocks
- [x] Add scanner flow tests where feasible and document manual device QA steps

### Acceptance criteria
- Supported devices can scan a barcode
- Scan flow uses backend contracts, not local-only frontend mocks
- Permission denial and scan failure are handled clearly
- Visiting `/scan` does not request camera access until the user explicitly starts scanning

---

## Phase 6 - Result Pages

### Tasks
- Build safe result page from mockup
- Build warning result page from mockup
- Build caution result page consistent with design system
- Render:
  - product identity
  - overall status
  - checked allergens
  - ingredient highlights
  - CTA actions
- Add support for favorites/save action

### Next session checklist
- [x] Fetch product detail and analysis for selected GTINs
- [x] Build shared result-state layout components
- [x] Implement safe result UI from mockup
- [x] Implement warning result UI from mockup
- [x] Implement caution result UI consistent with the design system
- [x] Render checked allergens and ingredient highlights from backend data
- [x] Add save-to-favorites interaction stub
- [x] Add component tests for safe, warning, and caution result variants

### Acceptance criteria
- All three result states work against placeholder backend data
- Result pages share reusable components
- Content is not obscured by sticky navigation

---

## Phase 7 - Search Enrichment and Caching

### Backend tasks
- [x] Add query normalization for search
- [x] Add caching for:
  - [x] search results by normalized query
  - [x] product details by GTIN
  - [x] preview analysis by `{gtin + selectedAllergens}`
- [x] Add optional enrichment pipeline for top-N search results
- [x] Ensure enrichment failures do not fail the base search request

### Frontend tasks
- [x] Render enriched search cards when available
- [x] Fall back to identity-only cards when enrichment is missing

### Acceptance criteria
- Base search stays fast
- Enrichment is optional and resilient
- Search cards can display status previews without blocking results

---

## Phase 8 - Secondary Screens

### Tasks
- [x] Implement `Home`
- [x] Implement `Favorites`
- [x] Implement `Profile`
- [x] Implement `History`
- Implement `Help`
- [x] Ensure navigation works end-to-end
- [x] Reuse placeholder backend where applicable
- Add purposeful empty states for Home, Favorites, History, and Help

### Acceptance criteria
- Navigation sections exist and do not dead-end
- Favorites naming is consistent across app
- Secondary screens have basic component test coverage
- Help content explains result meanings, privacy/storage basics, and scanner/search fallback paths

---

## Phase 9 - DABAS Integration Swap

### Tasks
- [x] Implement DABAS provider behind existing provider interface
- [x] Add API key configuration
- [x] Implement DABAS search using:
  - [x] `basesearchparameter`
  - [x] `searchparameter`
- [x] Implement DABAS GTIN detail lookup
- [x] Preserve normalized output contracts
- [x] Keep placeholder provider available for local/dev/test use

### Acceptance criteria
- Provider switch is config-driven
- Frontend requires no contract changes
- Placeholder and DABAS providers both pass contract tests
- DABAS adapter has basic mapping tests for search and GTIN detail normalization

---

## Design Fidelity Follow-Ups

### Tasks
- Fix Material Symbols rendering in the frontend and Playwright snapshots so icon text no longer appears in visual output
- Refine shared chrome in `/src/frontend/src/app/layout/AppShell.tsx` to better match the lighter, airier `stitch/` top bar and bottom nav
- Improve scanner/search/result visual fidelity where current UI still feels flatter than the `stitch/` references
- Replace or enhance monogram-only product media in search and result screens with richer editorial artwork treatments when product imagery is unavailable
- Add a richer editorial supporting card to search results to better match the asymmetry and content variety in `stitch/search_results`

### Acceptance criteria
- Playwright snapshots render Material Symbols correctly across onboarding, scanner, search, and result flows
- Shared app shell spacing and balance better match the `stitch/` mockups without breaking navigation behavior
- Search and result screens move closer to the mockup hierarchy and tonal layering while preserving backend-driven content

---

## Testing Backlog

### Frontend
- Component tests for onboarding, scanner search field, search results, and result pages
- Component tests for app-update prompt visibility and dismissal behavior
- Component tests for unknown-result rendering and secondary-screen empty states
- E2E tests for:
  - [x] onboarding -> scan
  - [x] onboarding -> search -> result
  - [x] scan -> result
- Playwright visual regression overview for:
  - [x] onboarding
  - [x] scanner
  - [x] scanner with search field
  - [x] search results
  - [x] safe result
  - [x] warning result
  - [x] caution result
- [x] Playwright E2E harness is configured in `/src/frontend/playwright.config.ts`
- [x] Basic accessibility audit coverage is in place for the scanner route
- [x] Basic accessibility audit coverage is in place for onboarding and result screens
- [x] Offline cached product-result fallback is covered by component and E2E tests
- [x] Offline cached search fallback is covered by component and E2E tests
- PWA update flow verification for waiting service worker detection and reload trigger
- Search pagination/refinement behavior once interactive refinement is implemented

---

## PWA Update Flow Follow-Up

### Tasks
- Keep a production-only service worker registration path compatible with the frontend build toolchain
- Add a SafeScan web app manifest with install metadata and icons
- Use a prompt-based update strategy instead of immediate takeover
- Cache the app shell and safe read-only requests only; avoid caching mutating API calls
- Add an in-app update banner with `Update now` and `Later` actions
- Trigger `skipWaiting` only after the user accepts the update
- Reload the page once the new service worker takes control
- Preserve local storage-backed profile, favorites, history, recent searches, and cached results across reloads
- Add test coverage for the update prompt state where practical

### Acceptance criteria
- A new frontend deployment produces a waiting service worker instead of silently replacing the open app
- The app surfaces a visible update banner when a waiting worker exists
- Clicking `Update now` activates the waiting worker and reloads the page
- Clicking `Later` dismisses the prompt for the current page session only
- Local storage-backed user state remains available after the update reload

---

## Missing Requirements Follow-Up

### Product and UX tasks
- Define and implement a first-class `Unknown` result screen and copy strategy
- Add Help route and screen implementation
- Formalize Home/Favorites/History/Profile empty-state behavior
- Decide whether search refinement chips are informational or interactive, then align UI and backend behavior
- Add returning-user launch behavior that routes users with a saved profile into the main app experience

### Backend and API tasks
- Document and expose `GET /api/reference/allergens`
- Expose `GET /health` readiness endpoint
- Add stable error-response shape requirements for frontend rendering
- Add paging or bounded-count behavior to search responses
- Expose metadata for cached/partial/enriched search responses where useful

### Offline and deployment tasks
- Add base-path-aware frontend deployment configuration
- Add explicit cache eviction/versioning rules for local storage-backed caches
- Add HTTPS/CORS/runtime-config deployment requirements to deployment docs or manifests

### Split deployment security tasks
- Add a deployment checklist for `frontend => GitHub Pages` and `backend => k3s/VPS`
- Ensure the frontend uses environment-aware `VITE_API_BASE_URL` configuration and does not embed provider credentials or private backend secrets
- Lock backend CORS to approved frontend origins only (GitHub Pages domain and any production custom domain)
- Add backend rate limiting for public search, lookup, and analysis endpoints to reduce scraping and quota abuse risk
- Add backend request validation limits for query length, GTIN format, request size, and malformed inputs
- Ensure production error responses do not expose stack traces, internal hostnames, or provider secrets
- Store DABAS credentials and other backend secrets in Kubernetes secrets or an external secret manager rather than repo files or container images
- Add ingress-level HTTPS, request-size limits, and upstream timeout settings for the public API
- Keep internal services private to the cluster/network and expose only the public API ingress
- Add health/readiness probes suitable for Kubernetes rollout and uptime monitoring
- Document that the static frontend is fully public and that the API must be treated as a public unauthenticated interface unless auth is added later
- Add guidance to avoid caching sensitive or user-specific API responses in the service worker
- Add logging/monitoring tasks for 4xx/5xx spikes, rate-limit events, and provider failures
- Add GitHub repository protections for the frontend deployment path, including branch protection and restricted deploy permissions

### Split deployment acceptance criteria
- The frontend build contains no private API keys, provider credentials, or environment secrets
- The public API is reachable only over HTTPS and responds correctly to the approved frontend origins
- CORS is restricted to known frontend origins and does not use an unrestricted wildcard policy for production
- Public endpoints enforce request validation and rate limits appropriate to unauthenticated traffic
- Backend secrets are injected securely at deploy time and are not committed to the repo or baked into images
- Production logs and error payloads do not leak sensitive backend or provider details

### Acceptance criteria
- Unknown results are rendered distinctly from generic request errors
- Help exists as a real destination and does not dead-end
- Secondary screens have documented empty and populated states
- Search behavior is explicit about ranking, paging, and chip behavior
- Health/reference endpoints are part of the stable contract surface

### Backend
- Unit tests for allergen mapping
- Unit tests for placeholder provider
- Integration tests for API endpoints
- Contract tests for DTO serialization
- [x] Provider-switch tests for placeholder vs DABAS implementations
- [x] DABAS-mode endpoint integration tests with stubbed HTTP responses
- [x] Guarded real-environment DABAS smoke test path

---

## Suggested Initial File/Module Targets

### Frontend
- `/src/frontend/app/router.tsx`
- `/src/frontend/app/layout/AppShell.tsx`
- `/src/frontend/features/onboarding/*`
- `/src/frontend/features/scanner/*`
- `/src/frontend/features/search/*`
- `/src/frontend/features/results/*`
- `/src/frontend/features/favorites/*`
- `/src/frontend/shared/api/*`
- `/src/frontend/shared/domain/*`
- `/src/frontend/shared/design/*`

### Backend
- `/src/backend/src/SafeScan.Api/*`
- `/src/backend/src/SafeScan.Application/*`
- `/src/backend/src/SafeScan.Domain/*`
- `/src/backend/src/SafeScan.Infrastructure/*`
- `/src/backend/src/SafeScan.Infrastructure/Providers/Placeholder/*`
- `/src/backend/src/SafeScan.Infrastructure/Providers/Dabas/*`

---

## Implementation Priority

1. Backend contracts and placeholder provider
2. Frontend shell and tokens
3. Onboarding and persisted allergy profile
4. Search flow
5. Scanner flow
6. Result pages
7. Search enrichment and caching
8. Secondary screens
9. DABAS provider swap

---

## Recommended Immediate Next Work

This is the recommended continuation point for the next coding session.

### Step 1 - Frontend shared integration layer
- [x] Add frontend DTOs for allergens, products, search results, and analysis responses
- [x] Add typed API helpers for reference, search, lookup, and analysis endpoints
- [x] Add a lightweight persisted profile store for selected allergens

### Step 2 - Real onboarding flow
- [x] Load allergen options from the backend
- [x] Replace static onboarding UI with controlled selection state
- [x] Persist the profile and navigate to the scan route

### Step 3 - Real search flow
- [x] Connect scanner search input to the backend search endpoint
- [x] Render backend search results instead of placeholder frontend cards
- [x] Carry selected allergens into search/result flow

### Step 4 - Result fetch wiring
- [x] Fetch backend product detail and analysis for selected GTINs
- [x] Use the fetched payload to prepare safe/warning/caution result page implementation

---

## Done Criteria

A feature is done when:
- it matches the agreed contract
- it follows the visual direction in the mockups
- it works with placeholder backend data
- it has at least basic test coverage
- it does not block later DABAS integration
