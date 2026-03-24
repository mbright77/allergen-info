# SafeScan Agent Context

This file is the single source of context for future work in this repository.

## Product Overview

SafeScan is a mobile-first allergen scanning app.

- Purpose: help users decide whether a grocery product is safe based on their saved allergy profile
- Core inputs: barcode scan or free-text search
- Core outputs: `Safe`, `MayContain`, `Contains`, or `Unknown`
- Canonical app name: `SafeScan`
- Canonical saved-products label: `Favorites`

Primary users:

- people with food allergies or intolerances
- parents checking products for children
- health-conscious shoppers

Core product goals:

- fast answers
- trustworthy allergen analysis
- accessible, mobile-first UX
- privacy-first handling of saved allergy preferences

## Current Architecture

Monorepo layout:

- frontend: `src/frontend`
- backend: `src/backend`

Frontend stack:

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- service worker based PWA support
- ZXing barcode scanning

Backend stack:

- ASP.NET Core Web API
- layered structure: API, Application, Domain, Infrastructure
- provider abstraction for placeholder data and DABAS integration
- xUnit tests

Important runtime model:

- frontend is fully public and must never contain secrets
- backend is the only trusted place for provider credentials and runtime secrets
- DABAS access is always mediated through the backend

## Product Scope

Implemented or established in the current architecture:

- onboarding with persisted allergy selection
- search-first scan flow with explicit camera activation
- GTIN lookup
- free-text search
- result screens for safe, caution, and warning outcomes
- favorites, profile, history, and home routes/screens
- local persistence for profile, recent searches, cached results, and saved items
- placeholder provider plus DABAS-backed provider support in backend contracts
- GitHub Pages frontend deployment support
- k3s/VPS backend deployment support

Important domain rules:

- distinguish `milk_protein` from `lactose`
- do not reduce incomplete analysis to safe by default
- support an explicit `Unknown` state when data is incomplete or conflicting

Initial allergen set:

- Milk Protein
- Lactose Intolerance
- Egg
- Gluten
- Nuts
- Soy
- Peanuts
- Fish
- Shellfish

## Core User Flows

1. First-time user selects allergens and starts scanning.
2. Returning user reopens the app and resumes with the saved profile.
3. User searches from the scan experience or scans a barcode.
4. Backend resolves product data and runs allergen analysis.
5. UI shows a clear result with highlighted ingredients and next actions.

Primary routes:

- `/`
- `/onboarding`
- `/home`
- `/scan`
- `/search/results`
- `/results/:gtin`
- `/favorites`
- `/profile`
- `/history`
- `/help`

## Design And UX Rules

The app should feel editorial, calm, premium, and spacious rather than generic.

- mobile-first layout
- strong whitespace and tonal layering
- soft rounded surfaces
- blurred/sticky shell elements where appropriate
- semantic color system for result states
- `Manrope` for display text
- `Inter` for body text

Key design constraints:

- preserve the visual direction from `stitch/`
- search must feel integrated into scanning, not bolted on
- use clear text labels, not color alone, for result states
- keep the shell branding aligned to `SafeScan`

Core color tokens:

- surface: `#fcf9f8`
- primary: `#00442d`
- primary_container: `#1d5c42`
- warning/red: `#b6171e`
- caution/yellow family from `#ffdfa0` / `#5c4300`

## Accessibility Requirements

Target WCAG 2.1 AA where practical.

- never rely only on color
- maintain strong contrast
- support visible focus states
- use large touch targets
- support zoom and text scaling
- provide readable scan/search/result instructions
- announce important status changes appropriately
- keep fixed UI from obscuring content
- use prompt-based PWA updates instead of silent takeover

Search-card image rules:

- if image is decorative, use empty alt text
- missing images must degrade gracefully
- image placeholders must not create noisy announcements

## Data, Search, And Analysis Model

Backend contracts center on:

- allergen reference list
- product detail by GTIN
- product search results
- allergen analysis result

Important search behavior:

- browser never talks to DABAS directly
- search can use product name, ingredient, brand, GTIN/EAN, or article number
- exact GTIN/EAN matches should rank highest
- search results are lightweight and normalized
- full product detail is fetched after selection
- preview badges and `imageUrl` are optional enrichment fields

Image enrichment strategy:

- DABAS base search responses do not reliably include images
- backend may hydrate top-N results via article detail
- enrichment must be best-effort and budget-limited
- fallback is `imageUrl: null`

Local persistence should cover:

- selected allergens
- recent searches
- recent scans/history
- cached products and search results
- favorites

Use versioned local-storage keys and recover safely from malformed persisted data.

## Deployment

Split deployment model:

- frontend: GitHub Pages
- backend: Ubuntu VPS running k3s behind nginx ingress

Current target URLs:

- frontend: `https://mbright77.github.io/allergen-info`
- backend: `https://hub.brightmatter.net/safescan-api`

Deployment files:

- frontend workflow: `.github/workflows/deploy-frontend-pages.yml`
- backend workflow: `.github/workflows/deploy-backend-k3s.yml`
- backend deploy script: `deploy/backend/deploy.sh`

Deployment rules:

- `RUN_DEPLOY` is a repository variable toggle, not a secret
- frontend must support base-path hosting under `/allergen-info/`
- backend must support ingress path base `/safescan-api`
- CORS must be restricted to approved frontend origins
- only backend secrets go into GitHub secrets / Kubernetes secrets

Key repository variables:

- required: `RUN_DEPLOY`, `FRONTEND_API_BASE_URL`, `FRONTEND_APP_BASE_PATH`, `VPS_HOST`, `VPS_USER`, `BACKEND_HOST`, `BACKEND_TLS_SECRET_NAME`, `ALLOWED_ORIGINS`
- recommended: `CERT_MANAGER_CLUSTER_ISSUER`
- optional: `BACKEND_PATH_PREFIX`, `BACKEND_ASPNETCORE_PATH_BASE`, `PRODUCT_CATALOG_PROVIDER`, `DABAS_BASE_URL`, `DABAS_API_KEY_HEADER_NAME`, `DABAS_API_KEY_QUERY_PARAMETER_NAME`, `GHCR_IMAGE_PULL_SECRET_NAME`, `VPS_PORT`, `K8S_INGRESS_CLASS`, `ASPNETCORE_ENVIRONMENT`

Key repository secrets:

- `VPS_SSH_PRIVATE_KEY`
- `DABAS_API_KEY` when live DABAS is enabled
- `GHCR_USERNAME`, `GHCR_TOKEN`, and optional `GHCR_EMAIL` only if GHCR packages are private

## Security Expectations

- never commit secrets, tokens, private keys, or production credentials
- never put provider credentials in frontend config
- treat the backend API as public unless authentication is added later
- CORS is not authentication
- use HTTPS in production for frontend and backend
- avoid logging sensitive values in workflows or deploy scripts
- avoid caching sensitive user-specific responses in the service worker

## Testing And Quality

Current quality expectations:

- frontend component tests for key flows
- backend unit and integration tests for contracts and providers
- Playwright E2E coverage for onboarding, scan, search, and result flows
- accessibility checks for core screens

Useful validation commands:

- frontend tests: `npm test` in `src/frontend`
- frontend build: `npm run build` in `src/frontend`
- backend tests: `dotnet test SafeScan.sln` in `src/backend`
- deploy script syntax: `bash -n deploy/backend/deploy.sh`

## Current And Future Work

Completed or largely established:

- placeholder and DABAS provider switching
- search-first scanner UX
- onboarding/profile persistence
- search results and enrichment foundation
- safe/caution/warning result pages
- home/favorites/profile/history screens
- prompt-based PWA update flow
- split deployment pipelines for frontend and backend

Important future work:

- implement the Help screen fully
- implement a first-class `Unknown` result screen and copy
- improve empty states across secondary screens
- decide whether search refinement chips are informational or interactive
- add paging or bounded-count behavior to search results where needed
- expose richer metadata for cached/partial/enriched search responses
- finish production-ready image enrichment for search cards
- add stronger request validation and rate limiting for public API endpoints
- improve production logging, monitoring, and alerting
- add branch protection and restricted deployment permissions
- improve offline cache eviction/versioning behavior
- continue visual fidelity work against `stitch/`
- verify PWA update flow and service worker behavior on deployed Pages builds

Possible later-phase product features:

- richer nutrition detail views
- better offline behavior for cached products/searches
- analytics and telemetry
- accounts/authentication if a private profile model is later needed
- cloud sync of user state
- advanced product guidance beyond allergen checks

## Conventions For Future Agents

- preserve `SafeScan` branding and `Favorites` naming
- keep frontend and backend contracts stable when swapping providers
- prefer placeholder-compatible contracts over provider-specific shapes
- do not commit generated build output
- keep deployment samples or unrelated infrastructure out of this repo
- when in doubt, treat `stitch/` as design direction and the existing code as the current implementation truth
