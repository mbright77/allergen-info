# Allergen Scanner App - Requirements and Implementation Plan

## 1. Purpose

This document defines the requirements, design constraints, architecture, API direction, and phased implementation plan for the Allergen Scanner application.

It is intended to guide an AI agent implementing:
- A React-based mobile-first Progressive Web App (PWA)
- A .NET C# REST API backend
- A UI closely aligned to the mockups in `stitch/`

---

## 2. Source Material Reviewed

### Product and requirement docs
- `prd_allergen_scanner_app.html`
- `doc_mock.md`
- `doc_v1.md`

### Mockups
- `stitch/allergy_selection/code.html`
- `stitch/product_scanner/code.html`
- `stitch/product_safe/code.html`
- `stitch/product_warning/code.html`

### Design guidance
- `stitch/vital_market/DESIGN.md`

### Notes
- `stitch/safescan_allergen_scanner/code.html` appears to duplicate the onboarding screen.
- The repo currently contains mockups and documentation, not an implementation scaffold.

---

## 3. Product Vision

A fast, trustworthy, mobile-first allergen scanner that helps users determine whether a grocery product is safe for them based on their allergy profile.

Core experience:
1. User selects allergens to avoid
2. User scans a product barcode
3. System retrieves product data
4. System evaluates product risk against the profile
5. User receives a clear result:
   - Safe
   - May contain traces
   - Contains allergen

---

## 4. Product Goals

### Primary goals
- Allow users to define a personal allergen profile
- Scan product barcodes using the device camera
- Retrieve product data by GTIN/EAN
- Analyze ingredients and allergen data against selected allergens
- Present highly legible, color-coded results
- Preserve the mockup design and visual identity
- Work well as a mobile PWA

### Secondary goals
- Save allergy profile locally
- Cache previously scanned products
- Provide recent scan history
- Allow saving products to a pantry/favorites list

### Out of scope for initial MVP
- User accounts and authentication
- Cloud sync of health data
- Social/community features
- Advanced nutrition coaching
- Full e-commerce integration

---

## 5. Users and Use Cases

### Primary users
- Individuals with food allergies or intolerances
- Parents checking products for children
- Health-conscious shoppers

### Core user needs
- Fast answers
- Trustworthy analysis
- Clear warnings
- Good accessibility
- Privacy-first handling of allergy data

---

## 6. Core Functional Scope

## 6.1 MVP
- Onboarding / allergen selection
- Local persistence of selected allergens
- Scanner screen using device camera
- GTIN-based product lookup
- Result screens for:
  - Safe
  - Contains allergen
  - May contain traces
- Ingredient highlighting
- Basic product details
- Local cache/history
- Mobile navigation shell

## 6.2 Future phases
- Profile editing
- Recent scan history screen
- Pantry/favorites
- Nutrition detail view
- Robust Dabas backend integration
- Better offline behavior
- Analytics/telemetry

---

## 7. Information Architecture

### Main sections
- Onboarding
- Home
- Scan
- Product Result
- Profile
- History
- Pantry / Saved
- Help

### Recommended routes
- `/`
- `/onboarding`
- `/home`
- `/scan`
- `/results/:gtin`
- `/profile`
- `/history`
- `/pantry`
- `/help`

### Notes
The mockups fully define:
- Onboarding
- Scanner
- Safe result
- Warning result

The following are implied but not yet designed:
- Home
- Profile
- History
- Pantry
- Help

---

## 8. User Flows

## 8.1 First-time user flow
1. User opens the app
2. User sees the onboarding screen
3. User selects one or more allergens
4. User taps `Save & Start Scanning`
5. Profile is stored locally
6. User is navigated to the scanner screen

## 8.2 Scan flow
1. User opens scanner
2. App requests camera access if needed
3. User aligns barcode in scanning frame
4. Barcode is detected
5. App resolves product by GTIN
6. App analyzes product against selected allergens
7. User is shown the appropriate result screen

## 8.3 Safe result flow
1. Product contains no relevant allergens
2. User sees a green-safe result
3. User reviews ingredients and allergen checks
4. User may save the product or scan another

## 8.4 Warning result flow
1. Product contains selected allergens
2. User sees a red warning result
3. Matching allergens are surfaced clearly
4. Ingredients are highlighted inline
5. User may scan another product

## 8.5 Caution flow
1. Product does not contain a selected allergen directly
2. Product has a `may contain` / trace warning
3. User sees a yellow caution state
4. User decides based on tolerance and context

---

## 9. Functional Requirements

## 9.1 Allergy Profile
The system shall:
- Allow multiple allergen selections
- Save selected allergens locally on device
- Reuse the profile in future scans
- Allow editing the profile later
- Explicitly distinguish milk protein allergy from lactose intolerance

### Initial allergen set from mockups/docs
- Milk Protein
- Lactose / Lactose Intolerance
- Egg
- Gluten
- Nuts
- Soy
- Peanuts
- Fish
- Shellfish

### Explicit milk-related distinction
- The mockups use the label `Milk`, but the implementation must not treat this as clinically ambiguous.
- The domain model shall represent `Milk Protein` as a distinct selectable risk category.
- `Lactose Intolerance` shall be modeled separately from `Milk Protein`.
- Ingredient mapping for `Milk Protein` should include protein-related terms such as whey, casein, milk solids, skimmed milk powder, and similar milk-derived proteins.
- `Lactose Intolerance` should be evaluated separately and must not be assumed to be identical to milk protein allergy.
- If the UI keeps the shorter mockup label `Milk`, it must still map internally to an explicit domain code rather than a vague free-text category.

### Recommended extensibility
Support future addition of:
- Sesame
- Mustard
- Celery
- Lupin
- Molluscs
- Sulphites

## 9.2 Barcode Scanning
The system shall:
- Use the device camera to scan barcodes
- Support GTIN/EAN formats
- Present a visible scanner frame
- Show simple scanning instructions
- Support flashlight/torch where available
- Prevent multiple rapid duplicate scans
- Recover gracefully from scan failures

## 9.3 Product Lookup
The system shall:
- Retrieve product data by GTIN
- Display name, category, and ingredients
- Display allergen-related data
- Cache prior lookups for faster repeated access

## 9.4 Allergen Analysis
The system shall:
- Compare product data against selected allergens
- Determine an overall result status
- Determine per-allergen statuses
- Highlight matched ingredients when possible

### Overall result states
- `Safe`
- `MayContain`
- `Contains`
- `Unknown`

### Per-allergen statuses
- `Contains`
- `MayContain`
- `NotFound`
- `Unknown`

## 9.5 Result Presentation
The UI shall:
- Use clear text labels, not color alone
- Show a strong status hero
- Surface direct allergen matches prominently
- Distinguish direct matches from trace warnings
- Show checked allergen list
- Show readable ingredients section
- Provide obvious next actions

## 9.6 Local Persistence
The app shall store locally:
- Selected allergens
- Recent scans
- Cached products
- Optional pantry/favorites entries

## 9.7 Error States
The app shall handle:
- Camera permission denied
- Camera unavailable
- Barcode not detected
- Unsupported barcode
- Product not found
- Backend/API unavailable
- Incomplete product data
- Offline usage

---

## 10. Screen Requirements

## 10.1 Onboarding / Allergy Setup
Derived from `stitch/allergy_selection/code.html`

### Required elements
- SafeScan branding in top bar
- Editorial heading and supporting text
- Allergen selection grid
- Strong selected state
- Privacy reassurance card
- Fixed bottom CTA

### Required behavior
- Multiple selections supported
- Persist selected values locally
- Navigate to scanner when saved

## 10.2 Scanner Screen
Derived from `stitch/product_scanner/code.html`

### Required elements
- Top app bar
- Camera viewport
- Scanner frame overlay
- Instruction text
- Torch toggle
- Scan interaction
- Bottom navigation
- Live analysis card

### Required behavior
- Ask for camera permission
- Decode barcode
- Show lookup/loading state
- Prevent accidental duplicate navigation

## 10.3 Safe Result Screen
Derived from `stitch/product_safe/code.html`

### Required elements
- Strong green hero with `SAFE`
- Product summary
- Analysis summary cards
- Checked allergen list
- Ingredients block
- Bottom nav
- CTA buttons

### Required behavior
- Show all monitored allergens checked
- Mark each as safe/not found when appropriate
- Allow scan continuation via nav or CTA

## 10.4 Warning Result Screen
Derived from `stitch/product_warning/code.html`

### Required elements
- Strong red warning hero
- Product summary
- Confirmed allergen alert
- Trace allergen alert
- Highlighted ingredient analysis
- Scan-again CTA
- Bottom nav

### Required behavior
- Confirmed allergens visually dominate
- Trace warnings remain clearly separate
- Ingredients map to highlighted allergens

## 10.5 Caution Result Screen
Not explicitly mocked, but required for full product logic.

### Required elements
- Yellow caution hero
- Explanation of trace-level risk
- Product summary
- Checked allergen list
- Ingredients section
- Next action CTA

---

## 11. Design Specification

## 11.1 Design Intent
The implementation must preserve the mockup style.

This should not become a generic dashboard or standard enterprise app. The desired tone is:
- Editorial
- Premium
- Calm
- Trustworthy
- Soft
- Spacious

## 11.2 Visual principles
- Mobile-first layout
- Strong use of whitespace
- Tonal layering rather than hard borders
- Soft rounded shapes
- Glassmorphism for sticky shell elements
- Typography-led hierarchy
- Clear semantic color use for status

## 11.3 Typography
Use:
- `Manrope` for display/headlines
- `Inter` for body/labels

### Rules
- Large expressive headings
- Compact uppercase micro-labels where useful
- Left-aligned body text
- No overly dense content blocks

## 11.4 Color tokens
Preserve these core values from the mockups/design guide:

### Surface system
- `surface`: `#fcf9f8`
- `surface_container_low`: `#f6f3f2`
- `surface_container_lowest`: `#ffffff`
- `surface_container_high`: `#eae7e7`
- `surface_container_highest`: `#e5e2e1`

### Brand system
- `primary`: `#00442d`
- `primary_container`: `#1d5c42`
- `primary_fixed`: `#b1f0ce`
- `primary_fixed_dim`: `#95d4b3`

### Warning system
- `secondary`: `#b6171e`
- `secondary_container`: `#da3433`
- `secondary_fixed`: `#ffdad6`
- `on_secondary_fixed_variant`: `#930010`

### Caution system
- `tertiary_fixed`: `#ffdfa0`
- `on_tertiary_fixed_variant`: `#5c4300`

### Text
- `on_surface`: `#1b1c1c`
- `on_surface_variant`: `#41493e`
- `outline_variant`: `#c0c9bb`

## 11.5 CTA styling
### Primary CTA
- Signature gradient from `primary` to `primary_container`
- Rounded full
- Bold label
- Large touch target

### Secondary CTA
- Neutral light surface
- Strong readable text
- Minimal visual noise

## 11.6 Layout and shell rules
- Keep a centered mobile-column layout even on large screens
- Use blurred top bar and bottom nav
- Avoid heavy divider lines
- Prefer spacing and surface changes over borders
- Respect safe-area insets on mobile devices

## 11.7 Status design rules
### Safe
- Green dominant hero
- Green chips/badges

### Warning
- Red dominant hero
- Red highlight chips for offending ingredients

### Caution
- Yellow dominant hero
- Yellow supporting chips and explanation text

---

## 12. Accessibility Requirements

The application should target WCAG 2.1 AA where practical.

### Required accessibility behavior
- Never rely only on color to communicate meaning
- Maintain strong text/background contrast
- Provide large touch targets
- Support visible focus states
- Use semantic buttons, headings, and landmarks
- Label nav items clearly
- Announce important status changes to screen readers
- Handle decorative images correctly
- Keep content readable around fixed-position UI

### Scanner-specific accessibility
- Provide readable instructions over the camera background
- Communicate permission and failure states in plain language
- Offer manual retry paths

---

## 13. Performance Requirements

## Frontend
- Lazy-load the scanner and barcode library
- Avoid blocking the UI while camera is active
- Cache results by GTIN
- Keep transitions responsive on lower-end devices

## Backend
- Cache external product lookups by GTIN
- Normalize data once and reuse
- Keep response times low for repeat scans

## PWA
- Fast shell load
- Installable manifest
- Offline shell support
- Graceful behavior for cached products offline

---

## 14. Privacy and Security Requirements

## Privacy
- Selected allergens should be stored locally by default
- Personal health preferences should not be shared unnecessarily
- Privacy behavior should be clearly communicated

## Security
- Dabas credentials must never be exposed in the frontend
- Product lookup should pass through a backend API
- Inputs should be validated
- External data should be treated carefully before rendering
- Basic request throttling/logging should be supported in the backend

---

## 15. Recommended Architecture

## 15.1 Frontend
### Recommended stack
- React
- TypeScript
- Vite
- React Router
- PWA plugin / service worker
- ZXing for barcode scanning
- TanStack Query for async/cache state
- Zustand or Context for lightweight app state
- CSS variables for design tokens

### Suggested frontend structure
- `src/app`
- `src/features/onboarding`
- `src/features/scanner`
- `src/features/results`
- `src/features/profile`
- `src/features/history`
- `src/features/pantry`
- `src/shared/ui`
- `src/shared/design`
- `src/shared/api`
- `src/shared/domain`

## 15.2 Backend
### Recommended stack
- .NET 8
- ASP.NET Core Web API
- Typed HTTP client for Dabas integration
- Memory cache initially
- Redis later if needed
- Swagger/OpenAPI
- xUnit tests

### Suggested backend layers
- API
- Application
- Domain
- Infrastructure
- Integrations/Dabas adapter

---

## 16. Domain Model

## 16.1 Allergen
```json
{
  "code": "milk_protein",
  "label": "Milk Protein",
  "synonyms": ["milk protein", "dairy protein", "whey", "casein", "milk solids", "skimmed milk powder"]
}
```

### Additional milk-related profile example
```json
{
  "code": "lactose",
  "label": "Lactose Intolerance",
  "synonyms": ["lactose", "milk sugar"]
}
```

## 16.2 UserAllergyProfile
```json
{
  "selectedAllergens": ["milk_protein", "soy", "gluten"],
  "updatedAt": "2026-03-21T10:00:00Z"
}
```

## 16.3 Product
```json
{
  "gtin": "1234567890123",
  "name": "Oatly Oat Drink",
  "brand": "Oatly",
  "category": "Beverage",
  "subtitle": "Enriched with vitamins and calcium",
  "ingredientsText": "Oat base (water, oats 10%), rapeseed oil...",
  "allergenStatements": {
    "contains": [],
    "mayContain": []
  },
  "nutritionSummary": {
    "energyKcal": 120,
    "sugarGrams": 4
  },
  "imageUrl": null,
  "source": "dabas"
}
```

## 16.4 AnalysisResult
```json
{
  "overallStatus": "Safe",
  "matchedAllergens": [],
  "traceAllergens": [],
  "checkedAllergens": [
    { "code": "milk", "status": "NotFound" },
    { "code": "egg", "status": "NotFound" }
  ],
  "ingredientHighlights": [],
  "explanations": [
    "No selected allergens were detected."
  ]
}
```

---

## 17. API Contract Proposal

## 17.1 Product lookup
`GET /api/products/gtin/{gtin}`

### Example response
```json
{
  "product": {
    "gtin": "1234567890123",
    "name": "Marabou Mjolkchoklad",
    "brand": "Marabou",
    "category": "Chocolate",
    "subtitle": "Classic Swedish Milk Chocolate",
    "ingredientsText": "Sugar, cocoa butter, whey powder (milk)...",
    "allergenStatements": {
      "contains": ["milk", "soy"],
      "mayContain": ["nuts", "wheat"]
    },
    "nutritionSummary": {
      "energyKcal": 550,
      "sugarGrams": 58
    }
  }
}
```

## 17.2 Product analysis
`POST /api/analysis`

### Request
```json
{
  "gtin": "1234567890123",
  "selectedAllergens": ["milk", "soy", "nuts"]
}
```

### Response
```json
{
  "product": {
    "gtin": "1234567890123",
    "name": "Marabou Mjolkchoklad"
  },
  "analysis": {
    "overallStatus": "Contains",
    "matchedAllergens": ["milk", "soy"],
    "traceAllergens": ["nuts"],
    "checkedAllergens": [
      { "code": "milk", "status": "Contains" },
      { "code": "soy", "status": "Contains" },
      { "code": "nuts", "status": "MayContain" }
    ],
    "ingredientHighlights": [
      {
        "text": "Whey powder (Milk)",
        "severity": "Contains",
        "allergenCode": "milk"
      },
      {
        "text": "Emulsifier (Soy lecithins)",
        "severity": "Contains",
        "allergenCode": "soy"
      }
    ]
  }
}
```

## 17.3 Future endpoints
- `GET /api/history`
- `POST /api/history`
- `GET /api/pantry`
- `POST /api/pantry`
- `DELETE /api/pantry/{gtin}`

---

## 18. Analysis Rules

## Recommended rule ownership
The backend should own:
- product normalization
- allergen mapping
- overall status calculation

The frontend may temporarily use mock analysis logic during early development.

## Matching requirements
The analysis should not rely only on naive string matching. It should use:
- canonical allergen codes
- synonym mappings
- explicit `contains` vs `may contain` parsing
- ingredient phrase normalization

### Explicit milk-related analysis rule
- `milk_protein` and `lactose` must be treated as separate domain concepts.
- A product flagged for `milk_protein` is unsafe for milk protein allergy, even if lactose-specific wording is absent.
- A product flagged for `lactose` does not automatically imply a milk protein match unless ingredient or allergen data also supports that conclusion.
- Backend normalization should maintain separate matching dictionaries and explanation text for these two cases.

## Important domain caution
Special handling may be needed for ambiguous or region-specific ingredient data, including:
- oats vs gluten/celiac concerns
- trace warnings
- incomplete allergen declarations

A dedicated allergen normalization document is recommended before production rollout.

---

## 19. Phased Implementation Plan

## Phase 0 - Finalize domain and contracts
### Deliverables
- allergen taxonomy
- DTO definitions
- result state rules
- error state matrix
- design token list

### Output
- requirements document
- API contract document
- design spec

## Phase 1 - Frontend foundation
### Deliverables
- React + TypeScript + Vite app
- routing
- app shell
- design tokens
- shared UI primitives
- PWA support

### Acceptance criteria
- app boots cleanly
- shell reflects mockup style
- tokens exist for color, typography, spacing, radii

## Phase 2 - Onboarding and local profile
### Deliverables
- onboarding screen
- allergen selection state
- local persistence
- navigation to scanner

### Acceptance criteria
- selections persist across refresh
- UI aligns closely with onboarding mockup

## Phase 3 - Scanner experience
### Deliverables
- camera access flow
- ZXing integration
- scan overlay
- torch toggle
- loading and failure states

### Acceptance criteria
- supported devices can scan barcodes
- duplicate scans are controlled
- permission denial is handled clearly

## Phase 4 - Mocked result flows
### Deliverables
- mock product repository
- mock analysis engine
- safe result
- warning result
- caution result

### Acceptance criteria
- all three result types work
- ingredient highlighting works
- fixed nav does not block content

## Phase 5 - .NET backend
### Deliverables
- ASP.NET Core API
- GTIN product lookup
- analysis endpoint
- Dabas integration layer
- caching

### Acceptance criteria
- frontend can switch from mock to API
- responses are normalized and stable
- Swagger/OpenAPI is available

## Phase 6 - Secondary features
### Deliverables
- profile edit
- history
- pantry
- nutrition detail

### Acceptance criteria
- user can review prior scans
- user can save products

## Phase 7 - Hardening
### Deliverables
- accessibility audit
- performance tuning
- offline support improvements
- telemetry/logging
- automated tests

### Acceptance criteria
- core flows work on real mobile devices
- accessibility and PWA quality are acceptable
- scan-to-result path is reliable

---

## 20. Testing Strategy

## Frontend
- Unit tests for view logic
- Component tests for onboarding/results
- End-to-end tests for scan/result flows
- Visual regression checks against mockups

## Backend
- Unit tests for allergen mapping
- Integration tests for endpoints
- Contract tests for DTO consistency
- Dabas adapter tests

## Manual QA scenarios
- first launch
- camera denied
- product not found
- safe result
- contains result
- may contain result
- offline with cached product
- large text / zoom
- keyboard navigation
- screen reader basics

---

## 21. Risks and Gaps

## Gaps in current input
- No dedicated caution/yellow result mock
- No full designs for Home/Profile/History/Pantry
- No explicit localization strategy
- No real Dabas contract included

## Primary risks
- Incorrect allergen matching if logic is too naive
- Scanner inconsistency across browsers/devices
- Content hidden behind fixed footer/nav
- Design drift away from the editorial visual system
- Incomplete product data leading to unclear result states

---

## 22. Open Decisions

These should be resolved early:
- UI language: English, Swedish, or multilingual?
- Exact allergen taxonomy for MVP?
- Will history/pantry be local-only first?
- How should `Unknown` results be displayed?
- What should happen when Dabas data is missing or incomplete?
- Should backend analysis be the long-term source of truth?

---

## 23. Recommended Build Order for an AI Agent

1. Create the React PWA shell and design tokens
2. Implement onboarding and local profile storage
3. Implement scanner route with mock scan flow
4. Build safe, warning, and caution result pages
5. Add stub Home/Profile/History pages
6. Build .NET API and DTO contracts
7. Replace mock data with backend integration
8. Add history, pantry, and nutrition detail
9. Harden accessibility, performance, and offline behavior

---

## 24. Agent Implementation Notes

- Treat the mockups as design requirements, not loose inspiration
- Preserve spacing, typography, tone, and status hierarchy
- Do not simplify into a generic admin/mobile template
- Build reusable result-state components
- Centralize domain enums and DTOs
- Isolate scanner code to reduce bundle cost
- Add a real caution state even though it is not fully mocked
- Define allergen normalization rules before productionizing analysis

---
