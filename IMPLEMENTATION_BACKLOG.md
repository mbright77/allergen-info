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
- Implement camera permission flow
- Add scanner frame overlay
- Add torch control where supported
- Add scan throttling / duplicate suppression
- Map scanned GTIN into backend product lookup
- Route successful lookup into result flow

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
- [x] Ensure navigation works end-to-end
- [x] Reuse placeholder backend where applicable

### Acceptance criteria
- Navigation sections exist and do not dead-end
- Favorites naming is consistent across app
- Secondary screens have basic component test coverage

---

## Phase 9 - DABAS Integration Swap

### Tasks
- Implement DABAS provider behind existing provider interface
- Add API key configuration
- Implement DABAS search using:
  - `basesearchparameter`
  - `searchparameter`
- Implement DABAS GTIN detail lookup
- Preserve normalized output contracts
- Keep placeholder provider available for local/dev/test use

### Acceptance criteria
- Provider switch is config-driven
- Frontend requires no contract changes
- Placeholder and DABAS providers both pass contract tests

---

## Testing Backlog

### Frontend
- Component tests for onboarding, scanner search field, search results, and result pages
- E2E tests for:
  - onboarding -> scan
  - onboarding -> search -> result
  - scan -> result
- Playwright visual regression overview for:
  - onboarding
  - scanner
  - scanner with search field
  - search results
  - safe result
  - warning result
  - caution result

### Backend
- Unit tests for allergen mapping
- Unit tests for placeholder provider
- Integration tests for API endpoints
- Contract tests for DTO serialization
- Provider-switch tests for placeholder vs DABAS implementations

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
