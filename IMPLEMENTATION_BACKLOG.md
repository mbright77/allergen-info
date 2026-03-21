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

### Acceptance criteria
- All three result states work against placeholder backend data
- Result pages share reusable components
- Content is not obscured by sticky navigation

---

## Phase 7 - Search Enrichment and Caching

### Backend tasks
- Add query normalization for search
- Add caching for:
  - search results by normalized query
  - product details by GTIN
  - preview analysis by `{gtin + selectedAllergens}`
- Add optional enrichment pipeline for top-N search results
- Ensure enrichment failures do not fail the base search request

### Frontend tasks
- Render enriched search cards when available
- Fall back to identity-only cards when enrichment is missing

### Acceptance criteria
- Base search stays fast
- Enrichment is optional and resilient
- Search cards can display status previews without blocking results

---

## Phase 8 - Secondary Screens

### Tasks
- Stub or implement:
  - Home
  - Favorites
  - Profile
  - History
- Ensure navigation works end-to-end
- Reuse placeholder backend where applicable

### Acceptance criteria
- Navigation sections exist and do not dead-end
- Favorites naming is consistent across app

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

## Done Criteria

A feature is done when:
- it matches the agreed contract
- it follows the visual direction in the mockups
- it works with placeholder backend data
- it has at least basic test coverage
- it does not block later DABAS integration
