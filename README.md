# SafeScan

![Frontend React](https://img.shields.io/badge/frontend-React-61DAFB?logo=react&logoColor=white)
![Frontend TypeScript](https://img.shields.io/badge/frontend-TypeScript-3178C6?logo=typescript&logoColor=white)
![Build Vite](https://img.shields.io/badge/build-Vite-646CFF?logo=vite&logoColor=white)
![Backend ASP.NET Core](https://img.shields.io/badge/backend-ASP.NET%20Core-512BD4?logo=dotnet&logoColor=white)
![Runtime .NET 9](https://img.shields.io/badge/runtime-.NET%209-512BD4?logo=dotnet&logoColor=white)
![Tests Vitest](https://img.shields.io/badge/tests-Vitest-6E9F18?logo=vitest&logoColor=white)
![Tests Playwright](https://img.shields.io/badge/tests-Playwright-2EAD33?logo=playwright&logoColor=white)

SafeScan is a mobile-first allergen scanning application. It helps users check grocery products against a saved allergy profile using barcode scans or free-text search.

## Overview

This repository contains the full SafeScan application as a monorepo:

- `src/frontend`: React + TypeScript + Vite web app
- `src/backend`: ASP.NET Core backend API and supporting application/domain/infrastructure projects
- `deploy/`: deployment scripts used by the repository workflows
- `.github/workflows/`: CI and deployment automation
- `docs/`: supporting project notes and reference material
- `stitch/`: design direction and UI reference assets

## What The App Does

- lets users create and manage named allergen profiles
- supports barcode scanning and manual product search
- analyzes products against the active profile
- returns `Safe`, `MayContain`, `Contains`, or `Unknown`
- stores local favorites, history, recent searches, and cached results
- supports optional product imagery and offline fallbacks for cached data

## Repository Structure

### Frontend

The frontend is a mobile-first React application with:

- React Router for navigation
- TanStack Query for API data fetching
- `html5-qrcode` for live barcode scanning
- service worker based PWA support
- local-storage persistence for profiles and saved collections

Key frontend areas include onboarding, scan/search, results, favorites, history, help, and profile management.

### Backend

The backend is a .NET 9 minimal API with:

- API, Application, Domain, and Infrastructure projects
- product catalog provider abstraction
- placeholder and DABAS-backed catalog support
- in-memory caching for product, search, and enrichment lookups
- allergen analysis and scan-resolution services

The API exposes endpoints for allergen reference data, product lookup, search, full analysis, and scan analysis.

## Main Technologies

- Frontend: React, TypeScript, Vite, React Router, TanStack Query
- Backend: ASP.NET Core, .NET 9
- Testing: Vitest, Playwright, xUnit

## Getting Started

Prerequisites:

- Node.js 22+
- npm
- .NET SDK 9.0+

Quick start:

1. Install frontend dependencies in `src/frontend` with `npm install`.
2. Start the backend from `src/backend` with `dotnet run --project src/SafeScan.Api`.
3. Start the frontend from `src/frontend` with `npm run dev`.
4. Open the Vite development URL shown in the terminal.

## Local Development

### Frontend

From `src/frontend`:

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm test
npm run build
npm run test:e2e
```

### Backend

From `src/backend`:

```bash
dotnet restore SafeScan.sln
dotnet run --project src/SafeScan.Api
```

Useful commands:

```bash
dotnet test SafeScan.sln
```

## Testing

This repository includes:

- frontend component tests
- Playwright end-to-end tests
- backend API and provider tests

## Additional Context

For the canonical repository context, product rules, and agent guidance, see `AGENTS.md`.
