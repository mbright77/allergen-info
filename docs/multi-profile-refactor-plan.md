# Multi-Profile Refactor Plan

## Goal

Refactor SafeScan's current single-profile frontend model into a named multi-profile system so a user can:

- create a profile with a name
- create additional profiles later
- allow empty profiles that can be configured later
- switch quickly between saved profiles from the top bar
- have the last active profile restored automatically on app start
- edit the currently selected profile from the bottom navigation `Profile` route

This plan assumes an aggressive frontend refactor is acceptable.

- No backward-compatibility migration is required.
- Existing single-profile storage can be replaced.
- Backend contracts do not need to change.

## Current State Summary

The current frontend stores exactly one local profile.

- Storage: `src/frontend/src/shared/profile/profile-storage.ts`
- Context provider: `src/frontend/src/shared/profile/ProfileProvider.tsx`
- Onboarding edits the one profile: `src/frontend/src/features/onboarding/OnboardingPage.tsx`
- Profile page edits the one profile: `src/frontend/src/features/profile/ProfilePage.tsx`
- The top-right profile icon is decorative only: `src/frontend/src/app/layout/AppShell.tsx`
- App startup always redirects `/` to `/onboarding`: `src/frontend/src/app/router.tsx`

## Product Decisions Captured In This Plan

- Profiles are local-only and privacy-first.
- Each profile has a user-provided name.
- Empty profiles are allowed.
- The last active profile remains active when the app starts.
- The top-right profile control becomes the profile switcher.
- The bottom-nav `Profile` tab edits the currently active profile.
- Switching profiles updates the active allergen set used by scan, search, and result analysis.
- Favorites, history, and recent searches remain global for this refactor.

## Non-Goals For This Refactor

The following should stay out of scope for the first implementation pass:

- backend API changes
- authentication or cloud sync
- per-profile favorites/history/recent searches
- profile import/export
- account-level sharing between devices
- compatibility support for the old single-profile local-storage shape

## Target User Flows

### First-time user

1. User opens the app.
2. App sees there are no profiles.
3. App routes to onboarding.
4. User enters a profile name.
5. User optionally selects allergens.
6. User saves the profile.
7. App sets that profile as active and routes to the main experience.

### Returning user

1. User opens the app.
2. App restores the last active profile from local storage.
3. App routes to the main app, not onboarding.

### Switch profile

1. User opens the top-right profile control in the app shell.
2. User sees saved profile names.
3. User selects a profile.
4. App makes that profile active immediately.
5. All active allergen-dependent screens use the selected profile.

### Add profile later

1. User opens the top-right profile control.
2. User chooses `Add profile`.
3. User enters a profile name and optionally selects allergens.
4. App saves the new profile and makes it active.

### Edit allergens in an existing profile

1. User selects the desired profile from the top-right switcher.
2. User taps the bottom-nav `Profile` item.
3. The profile page opens for the currently active profile.
4. User updates the profile name and/or allergen selection.
5. Changes persist locally and affect subsequent analysis.

## Architecture Direction

The refactor should keep the existing frontend architecture intact where possible:

- continue using local storage as the persistence layer
- continue exposing active profile state through React context
- continue deriving analysis input from the active profile's allergen list
- keep backend requests unchanged by continuing to send `selectedAllergens`

The main architectural change is to replace a singleton profile model with a profile registry plus active-profile pointer.

## Data Model

### New storage key

Use a new key and treat it as authoritative:

- `safescan.profiles.v1`

### Proposed storage shape

```ts
type StoredProfilesState = {
  activeProfileId: string | null
  profiles: StoredProfile[]
}

type StoredProfile = {
  id: string
  name: string
  selectedAllergens: string[]
  createdAt: string
  updatedAt: string
}
```

### Data rules

- `id` should be a stable unique string
- `name` is required and trimmed before save
- `selectedAllergens` must be deduplicated
- `activeProfileId` should either match an existing profile or be `null`
- malformed storage should reset safely to an empty state

## Provider Refactor

### Current file

- `src/frontend/src/shared/profile/ProfileProvider.tsx`

### New provider responsibilities

Refactor `ProfileProvider` from a selected-allergens wrapper into a profile-management context.

Recommended context surface:

```ts
type ProfileContextValue = {
  profiles: Profile[]
  activeProfileId: string | null
  activeProfile: Profile | null
  selectedAllergens: string[]
  hasProfiles: boolean
  createProfile: (input: { name: string; selectedAllergens: string[] }) => string
  setActiveProfile: (profileId: string) => void
  updateActiveProfile: (input: { name: string; selectedAllergens: string[] }) => void
  toggleAllergen: (code: string) => void
}
```

### Behavior requirements

- `selectedAllergens` should remain available so existing consumers need only minimal changes
- `activeProfile` should be the single source of truth for current profile behavior
- all writes should persist to local storage
- `toggleAllergen` should act on the active profile only
- `createProfile` should return the new profile id so callers can navigate if needed
- if `setActiveProfile` is called with an invalid id, ignore it safely

### Optional helper split

If the provider becomes too large, split profile operations into small helpers inside the same folder:

- `profile-storage.ts`
- `profile-model.ts` or equivalent optional helper file

Keep the refactor minimal. Do not introduce unnecessary abstractions.

## Routing Changes

### Current file

- `src/frontend/src/app/router.tsx`

### Required changes

Replace the unconditional `/ -> /onboarding` behavior with profile-aware startup routing.

Recommended behavior:

- if no saved profiles exist, route `/` to `/onboarding`
- if an active profile exists, route `/` to `/home`

### Recommended implementation

Add a small route guard or redirect component that reads profile state and returns the appropriate `<Navigate />`.

This avoids hardcoding the startup route independent of profile existence.

### New route

Add a route for creating additional profiles after onboarding:

- `/profiles/new`

Recommended page:

- `src/frontend/src/features/profile/NewProfilePage.tsx`

## Onboarding Refactor

### Current file

- `src/frontend/src/features/onboarding/OnboardingPage.tsx`

### New onboarding responsibility

Onboarding should become a first-profile creation flow, not a generic allergen-only setup page.

### Required UI changes

Add:

- profile name input field
- allergen selection grid
- summary/help text explaining that allergens can be added later

### Save behavior

On save:

1. trim the entered profile name
2. validate that the name is not empty
3. create a profile with the chosen allergens, which may be empty
4. set that profile active
5. route to `/home` or `/scan`

Recommendation:

- route to `/home` after profile creation because it better supports resuming and context switching

### Validation rules

- profile name is required
- allergen selection is optional

### Copy direction

The page should explain:

- this is the first profile setup
- profile names help distinguish family members
- allergen choices can be edited later from the profile screen

## New Profile Creation Flow

### New page

- `src/frontend/src/features/profile/NewProfilePage.tsx`

### Purpose

This page supports adding a second or later profile after initial onboarding.

### Required behavior

- same profile name input as onboarding
- same allergen selection UI
- allow empty allergen selection
- save the new profile
- set it active immediately
- route to `/profile` or `/home`

Recommendation:

- route to `/profile` after creating a new profile so the user lands in the editable context for that specific profile

## Shared Profile Editing UI

### Recommended shared component

Create a reusable editor component for profile forms.

Suggested file:

- `src/frontend/src/features/profile/ProfileEditor.tsx`

### Why

The onboarding screen, add-profile screen, and profile-edit screen will all need:

- profile name input
- allergen selection grid
- summary text
- save action state

Extracting the shared form avoids triplicate UI logic while keeping page-level behavior separate.

### Suggested responsibilities

Props might include:

- `mode: 'create' | 'edit'`
- `initialName`
- `initialSelectedAllergens`
- `saveLabel`
- `onSave`
- optional `onCancel`

This should remain a UI component, not another state owner.

## Profile Page Refactor

### Current file

- `src/frontend/src/features/profile/ProfilePage.tsx`

### New responsibility

The page should edit the currently active profile.

### Required UI changes

Add or update:

- active profile name in the hero/header
- editable name field
- allergen selection grid for the active profile
- summary text based on the active profile

### Required behavior

- if no active profile exists, redirect to `/onboarding`
- edits apply only to the currently active profile
- changes persist immediately or via explicit save, depending on chosen UX

Recommendation:

- use an explicit save action for the name field and allergen changes so the interaction is predictable

### Optional extra

If desired later, the page can expose delete behavior, but deletion is not required for the first pass and should be omitted to keep scope down.

## Top Bar Profile Switcher

### Current file

- `src/frontend/src/app/layout/AppShell.tsx`

### New responsibility

Replace the decorative avatar shell with a real profile switch control.

### Required UI behavior

The top-right profile control should:

- be keyboard accessible
- have a clear label such as `Profiles`
- show the active profile name or initials if space allows
- open a menu, sheet, or popover listing all saved profiles
- highlight the active profile
- include an `Add profile` action

### Switcher actions

- selecting a saved profile calls `setActiveProfile(profileId)`
- selecting `Add profile` navigates to `/profiles/new`

### UX recommendation

Prefer a mobile-friendly sheet or anchored popover rather than a full-page list for switching.

The control should feel calm and integrated with the current shell, not like an account-management screen.

## Screen Copy Updates

Several screens should be updated to reflect named profiles instead of a generic singleton profile.

### Home page

Current file:

- `src/frontend/src/features/home/HomePage.tsx`

Recommended updates:

- replace anonymous copy with active-profile-aware copy
- show the active profile name in hero or summary text

Example direction:

- `Anna is active with 5 monitored allergens.`
- `No allergens selected yet for Anna.`

### Result pages

Current files:

- `src/frontend/src/features/results/ProductResultPage.tsx`
- `src/frontend/src/features/results/ScannedResultPage.tsx`

Recommended updates:

- keep logic unchanged where possible
- optionally show the active profile name in `Your profile` sections or headings
- do not change backend payloads

## Storage Implementation Notes

### Target file

- `src/frontend/src/shared/profile/profile-storage.ts`

### Required functions

Refactor this module to expose something like:

```ts
export function readStoredProfilesState(): StoredProfilesState
export function writeStoredProfilesState(state: StoredProfilesState): void
```

### Validation behavior

- ignore invalid profiles
- dedupe allergen codes
- trim names
- reject empty names on write paths from UI code
- safely recover from malformed JSON

### Unique id generation

Use a simple browser-safe unique id strategy.

Examples:

- `crypto.randomUUID()` when available
- a small fallback if needed

Because aggressive refactoring is acceptable, a modern browser-first approach is fine.

## Collections Scope Decision

### Current files

- `src/frontend/src/shared/collections/storage.ts`
- `src/frontend/src/shared/collections/CollectionsProvider.tsx`

### Decision for this refactor

Leave collections global.

This means:

- `favorites` remain shared across the device
- `history` remains shared across the device
- recent searches remain shared across the device

### Reason

This keeps the refactor focused on profile handling and avoids widening the scope to multiple persistence systems in one pass.

## Test Plan

### Storage tests

Add or update tests to cover:

- empty storage returns no profiles and no active profile
- malformed JSON resets safely
- multiple profiles persist correctly
- active profile id persists correctly
- duplicate allergen codes are deduplicated

### Provider tests

Add or update tests to cover:

- profile creation
- active profile switching
- editing active profile name
- editing active profile allergens
- creating a new profile sets it active

### Routing tests

Add or update tests to cover:

- `/` routes to `/onboarding` when no profiles exist
- `/` routes to `/home` when a saved active profile exists

### Onboarding tests

Current file:

- `src/frontend/src/features/onboarding/OnboardingPage.test.tsx`

Cover:

- profile name is required
- user can save with empty allergen selection
- save creates the first profile and routes forward

### Profile page tests

Current file:

- `src/frontend/src/features/profile/ProfilePage.test.tsx`

Cover:

- current active profile is loaded
- changing name and allergens updates only the active profile
- switching profiles elsewhere changes what the page edits

### App shell tests

Add tests for:

- top-bar profile switcher renders saved profiles
- selecting a profile changes active profile
- `Add profile` action routes correctly

### Home page tests

Current file:

- `src/frontend/src/features/home/HomePage.test.tsx`

Cover:

- active profile name appears in copy
- allergen count reflects the active profile

## Accessibility Requirements For This Feature

The implementation should follow existing app accessibility rules.

Specific requirements:

- profile switcher must be reachable by keyboard
- profile list/menu must have clear labels
- active profile should be conveyed by text, not color alone
- input field labels must be explicit
- save validation errors must be readable and announced appropriately
- touch targets in the profile switcher should remain large enough for mobile use

## Implementation Order

Recommended sequence:

1. Refactor profile storage to the new multi-profile shape.
2. Refactor `ProfileProvider` to expose profile management.
3. Update startup routing to be profile-aware.
4. Build the shared `ProfileEditor` form UI.
5. Update onboarding to create the first named profile.
6. Add the `NewProfilePage` route and page.
7. Refactor `ProfilePage` to edit the active profile.
8. Replace the top-right avatar with the profile switcher in `AppShell`.
9. Update home and any copy that references the current profile.
10. Add or update tests.
11. Update `AGENTS.md` to reflect the new product behavior.

## File Checklist

Expected touched files:

- `src/frontend/src/shared/profile/profile-storage.ts`
- `src/frontend/src/shared/profile/ProfileProvider.tsx`
- `src/frontend/src/app/router.tsx`
- `src/frontend/src/app/layout/AppShell.tsx`
- `src/frontend/src/features/onboarding/OnboardingPage.tsx`
- `src/frontend/src/features/profile/ProfilePage.tsx`
- `src/frontend/src/features/home/HomePage.tsx`
- `src/frontend/src/features/results/ProductResultPage.tsx`
- `src/frontend/src/features/results/ScannedResultPage.tsx`
- `src/frontend/src/features/profile/ProfileEditor.tsx`
- `src/frontend/src/features/profile/NewProfilePage.tsx`
- relevant test files under `src/frontend/src/**`
- `AGENTS.md`

## Risks And Watchouts

- accidental null-state bugs when no active profile exists
- stale UI if the app shell and profile page derive active profile differently
- over-scoping into profile-scoped favorites/history
- introducing too much abstraction into a relatively small local-state feature
- changing onboarding and startup routing at the same time without enough test coverage

## Success Criteria

The refactor is complete when:

- a first-time user can create a named profile in onboarding
- a profile can be saved without selecting any allergens
- additional profiles can be created later
- the top-right profile control can switch between saved profiles
- the selected profile remains active after a reload
- the bottom-nav `Profile` screen edits the active profile
- search, scan, and results use the active profile's allergens
- the app no longer depends on the old single-profile storage model
- `AGENTS.md` documents the updated behavior
