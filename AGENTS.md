# SafeScan Agent Context

This file is the single source of context for work in this repository.

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
- `i18next`, `react-i18next`, `i18next-http-backend`, and `i18next-browser-languagedetector`
- service worker based PWA support
- `html5-qrcode` barcode scanning
- local-storage persistence for profiles and collections

Backend stack:

- ASP.NET Core minimal API
- .NET 9 solution with API, Application, Domain, and Infrastructure projects
- provider abstraction with placeholder and DABAS-backed catalog sources
- in-memory caching around allergen, product, search, and preview enrichment lookups
- xUnit API and provider tests

Important runtime model:

- frontend is fully public and must never contain secrets
- backend is the only trusted place for provider credentials and runtime secrets
- the browser talks only to the SafeScan backend API
- DABAS access is always mediated through the backend

Frontend i18n model:

- shared i18n setup lives in `src/frontend/src/shared/i18n`
- translation files live in `src/frontend/public/locales/{lng}/{ns}.json`
- the shipped locales are currently `en` and `sv`
- use feature-aligned namespaces such as `common`, `app`, `onboarding`, `home`, `scanner`, `search`, `results`, `profile`, `favorites`, `history`, and `help`
- use nested keys like `t('Hero.Title')`, not flat global keys
- localize only display labels; keep canonical backend values, enum values, allergen codes, GTINs, and persisted values unchanged
- locale-aware date, time, and number formatting must go through shared helpers rather than hardcoded English formatting
- the language switcher belongs inside the existing profile menu in `src/frontend/src/app/layout/AppShell.tsx`, not as a separate standalone control

## Product Scope

Implemented application functionality:

- onboarding with named profile creation and optional allergen selection
- multiple saved profiles with active-profile switching from the top bar
- search-first scan screen with explicit camera activation
- live barcode scanning with rear-camera preference when labels are available
- scanner controls for torch and zoom when the device exposes those capabilities
- GTIN product lookup
- free-text product search
- scan resolution flow for full, unverified, basic, and not-found outcomes
- product result screens covering safe, caution, warning, and unknown states
- Help, Home, Favorites, Profile, New Profile, and History screens
- prompt-based PWA update banner and reload flow
- offline messaging plus cached fallback for search results and product analysis
- favorites, history, recent searches, and cached result persistence in local storage
- optional product imagery on search cards, result cards, and saved favorites when available

Important domain rules:

- do not reduce incomplete analysis to safe by default
- support an explicit `Unknown` state when data is incomplete, unverified, conflicting, or not analyzable for the current request
- use the EU 14 allergen model for user selection and API-facing allergen identifiers
- perform allergen matching from GS1 allergen codes, not free-text comparison
- when no allergens are selected for a full analysis request, the analysis result remains `Unknown`

Current allergen set:

- Cereals containing gluten
- Crustaceans
- Eggs
- Fish
- Peanuts
- Soybeans
- Milk
- Tree nuts
- Celery
- Mustard
- Sesame seeds
- Sulphur dioxide / sulphites
- Lupin
- Molluscs

## Core User Flows

1. First-time user creates a named profile, optionally selects allergens, and enters the app.
2. Returning user reopens the app and resumes with the last active saved profile.
3. User can switch profiles from the top-bar profile switcher or add another profile from the same menu.
4. User can search from the scan screen or activate the camera for live barcode scanning.
5. Backend resolves product data and runs allergen analysis against the active profile.
6. UI shows a result state, checked allergens, ingredient review, and next actions.
7. User can save full product results to Favorites and revisit analyzed products through History.

Primary routes:

- `/`
- `/onboarding`
- `/home`
- `/scan`
- `/search/results`
- `/results/scan/:code`
- `/results/:gtin`
- `/favorites`
- `/profile`
- `/profiles/new`
- `/history`
- `/help`

## Design And UX Rules

The app should feel editorial, calm, premium, and spacious rather than generic.

- mobile-first layout
- strong whitespace and tonal layering
- soft rounded surfaces
- blurred or sticky shell elements where appropriate
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
- provide readable scan, search, and result instructions
- announce important status changes appropriately
- keep fixed UI from obscuring content
- use prompt-based PWA updates instead of silent takeover

Image handling rules:

- decorative product images use empty alt text
- missing images must degrade gracefully to non-image fallbacks
- image placeholders must not create noisy announcements

## Data, Search, And Analysis Model

Backend contracts center on:

- allergen reference list
- product detail by GTIN
- product search results
- allergen analysis result
- scan analysis result

Current API surface:

- `GET /api/reference/allergens`
- `GET /api/products/gtin/{gtin}`
- `GET /api/products/search?q=...&selectedAllergens=...`
- `POST /api/analysis`
- `POST /api/analysis/scan`
- `GET /health`

Current search behavior:

- search accepts product name, ingredient, brand, GTIN or article number style queries
- empty search requests are rejected by the backend and guarded in the frontend UI
- search result cards render as a uniform grid of clickable cards
- pack size is preferred in supporting text when available
- category and preview badges render as chips or supporting metadata
- search results may include preview status, preview badge, preview note, and optional `imageUrl`
- search responses are cached in the browser for offline fallback per query plus selected allergen set
- recent searches are saved locally and can be relaunched from the scan and home screens
- recent-search cards on the home screen may render an optional stored `imageUrl` from the latest saved search response

Current scan behavior:

- live scanning keeps the camera off until the user explicitly activates it
- the scanner attempts EAN-13 barcode detection only
- camera selection prefers a rear main camera over front, ultrawide, macro, or telephoto cameras when labels make that distinction possible
- scanning requires repeated matching reads before a detection is accepted
- direct GTIN lookup is attempted first
- if direct lookup misses, the backend falls back to product search using the scanned code
- GTINs that differ only by leading zeros are treated as verified matches
- materially different resolved GTINs return an `Unverified` scan result
- if no detailed product record can be retrieved after search resolution, the backend returns a `Basic` unknown response using fallback product data

Current analysis behavior:

- full analysis compares selected allergens against normalized product allergen facts
- `Contains` wins over `MayContain`, and `MayContain` wins over `Safe`
- `Unknown` is used for missing selections, scan fallback cases, and cases where data cannot support a confident answer
- ingredient highlights are filtered to the allergens selected in the active profile
- explanations are returned with each analysis result

Image enrichment behavior:

- product detail responses may include `imageUrl`
- search results may carry `imageUrl` directly or receive it from backend enrichment
- backend search enrichment checks the first 20 search results in batches of 5
- exact GTIN and exact article-number matches can also be enriched outside that default window
- search card imagery prefers backend-provided URLs and falls back to monograms in the UI

## Local Persistence

Local persistence currently covers:

- multiple named profiles with an active-profile pointer
- recent searches, limited to the latest 6 entries
- recent searches may store an optional `imageUrl` for home-page card artwork
- recent scans or analyses in history, limited to the latest 20 entries
- cached search responses, limited to the latest 8 cache entries
- cached analysis responses, limited to the latest 12 cache entries
- favorites

Profile handling rules:

- each profile must have a user-provided name
- profiles may be saved with zero selected allergens
- the last active profile is restored on app start
- malformed stored profile state is ignored safely and replaced with an empty default state
- the top-right shell control is the primary profile switcher and add-profile entry point
- the bottom-nav `Profile` route edits the currently active profile
- favorites, history, and recent searches are device-global and not profile-scoped

Favorites and history persistence notes:

- saved favorites store core product identity, result status, timestamps, and optional `imageUrl`
- favorites are added or removed from the full product result screen
- favorites without `imageUrl` still render safely with a non-image fallback
- history entries are added automatically when a product analysis screen is opened successfully or when a scan fallback response returns product data

Storage reliability rules:

- use versioned local-storage keys
- recover safely from malformed persisted data
- deduplicate saved profile allergen selections and recent-search queries where applicable

## Help And Guidance Content

The Help screen currently explains:

- how the active profile and allergen selection work
- that profiles can be saved with zero allergens selected
- what `Safe`, `May contain`, `Contains`, and `Unknown` mean
- that the package label remains the final source of truth when data is missing or unclear

## Deployment And Configuration

Current repository deployment assets:

- frontend workflow: `.github/workflows/deploy-frontend-pages.yml`
- backend workflow: `.github/workflows/deploy-backend-k3s.yml`
- backend deploy script: `deploy/backend/deploy.sh`

Current deployment model in the repository:

- frontend build and deploy automation exists for a static Pages-style host
- backend build, container publish, and remote deploy automation exists for a k3s-based environment
- deployment is gated by the `RUN_DEPLOY` repository variable
- frontend runtime uses configurable environment variables for API base URL and app base path
- backend runtime uses configuration for provider selection, path base, CORS, and DABAS access

## Security Expectations

- never commit secrets, tokens, private keys, or production credentials
- never put provider credentials in frontend config
- treat the backend API as public unless authentication is added later
- CORS is not authentication
- use HTTPS in deployment environments
- avoid logging sensitive values in workflows or deploy scripts
- avoid caching sensitive user-specific responses in the service worker

## Testing And Quality

Current quality coverage includes:

- frontend component tests for onboarding, scanner, search, results, favorites, help, history, home, and profile flows
- backend tests for endpoints, placeholder behavior, DABAS mapping, search enrichment, scan analysis resolution, and caching behavior
- Playwright E2E coverage for onboarding, scan, search, and result flows

Useful validation commands:

- frontend lint: `npm run lint` in `src/frontend`
- frontend tests: `npm test` in `src/frontend`
- frontend build: `npm run build` in `src/frontend`
- backend tests: `dotnet test SafeScan.sln` in `src/backend`
- deploy script syntax: `bash -n deploy/backend/deploy.sh`

## Conventions For Future Agents

- preserve `SafeScan` branding and `Favorites` naming
- keep frontend and backend contracts stable when swapping providers
- prefer placeholder-compatible contracts over provider-specific shapes
- do not commit generated build output
- keep deployment samples or unrelated infrastructure out of this repo
- keep `AGENTS.md` up to date whenever code behavior, architecture, workflows, deployment, or product expectations change; this is a required part of the same change set, not a separate optional follow-up
- when in doubt, treat `stitch/` as design direction and the existing code as the current implementation truth
- when adding or changing frontend copy, update the correct locale namespace JSON instead of reintroducing hardcoded JSX strings
