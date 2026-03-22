# Deployment Guide

This project is deployed as two separate delivery targets:

- frontend -> GitHub Pages
- backend -> Ubuntu VPS running k3s with nginx ingress

The frontend is public static content. The backend is the only trusted place for provider credentials and runtime secrets.

## Architecture

### Frontend
- Source: `src/frontend`
- Build: Vite production build
- Host: GitHub Pages
- Workflow: `.github/workflows/deploy-frontend-pages.yml`

### Backend
- Source: `src/backend`
- Build: Docker image built in GitHub Actions
- Registry: GHCR (`ghcr.io`)
- Host: k3s on VPS via remote deploy script
- Workflow: `.github/workflows/deploy-backend-k3s.yml`
- Deploy assets: `deploy/backend`

## Workflow overview

### Frontend workflow
The frontend workflow:
1. checks out the repo
2. installs frontend dependencies
3. runs frontend tests
4. builds the frontend with repo variables
5. uploads the built site to GitHub Pages

### Backend workflow
The backend workflow:
1. checks out the repo
2. restores, builds, and tests the backend
3. builds a Docker image
4. pushes the image to GHCR
5. uploads a deploy bundle
6. connects to the VPS over SSH
7. runs `deploy/backend/deploy.sh`
8. updates Kubernetes config, secrets, deployment, service, and ingress
9. waits for rollout to complete

## GitHub repository variables

Add these as repository variables.

### Required variables
- `RUN_DEPLOY`
  - deployment toggle for both workflows
  - set to `true` to allow production deployments
- `FRONTEND_API_BASE_URL`
  - public backend API base URL used at frontend build time
  - example: `https://sub.domain.net/safescan-api`
- `FRONTEND_APP_BASE_PATH`
  - Vite base path for GitHub Pages
  - example for default Pages domain: `/allergen-info/`
- `VPS_HOST`
  - VPS hostname or IP used for SSH deployment
- `VPS_USER`
  - SSH user on the VPS with permission to run `kubectl`
- `BACKEND_HOST`
  - public hostname used by the backend ingress
  - example: `sub.domain.net`
- `BACKEND_TLS_SECRET_NAME`
  - cert-manager-managed TLS secret name referenced by the ingress
- `ALLOWED_ORIGINS`
  - comma-separated list of frontend origins allowed by backend CORS
  - example: `https://mbright77.github.io`

### Strongly recommended variables
- `CERT_MANAGER_CLUSTER_ISSUER`
  - cert-manager issuer name used by ingress
  - example: `letsencrypt-prod`

### Optional variables
- `VPS_PORT`
  - defaults to `22`
- `BACKEND_PATH_PREFIX`
  - defaults to `/`
  - set this if the API is hosted under a path prefix such as `/safescan-api`
- `K8S_INGRESS_CLASS`
  - defaults to `nginx`
- `ASPNETCORE_ENVIRONMENT`
  - defaults to `Production`
- `PRODUCT_CATALOG_PROVIDER`
  - defaults to `Placeholder`
  - switch to `Dabas` later
- `DABAS_BASE_URL`
  - defaults to `https://api.dabas.com/`
- `DABAS_API_KEY_HEADER_NAME`
  - optional unless your DABAS auth requires a header
- `DABAS_API_KEY_QUERY_PARAMETER_NAME`
  - defaults to `apikey`
- `GHCR_IMAGE_PULL_SECRET_NAME`
  - defaults to `ghcr-pull-secret`
  - only relevant for private GHCR images

### Built-in deployment defaults
These do not need repo variables unless you later decide to make them configurable:
- Kubernetes namespace: `safescan`
- Deployment name: `safescan-api`
- Service name: `safescan-api`
- Ingress name: `safescan-api`
- Container port: `8080`

## GitHub repository secrets

Add these as repository secrets.

- `VPS_SSH_PRIVATE_KEY`
  - private SSH key used by GitHub Actions to reach the VPS
- `DABAS_API_KEY`
  - only required when `PRODUCT_CATALOG_PROVIDER=Dabas`
- `GHCR_USERNAME` (required only if the GHCR image package is private)
- `GHCR_TOKEN` (required only if the GHCR image package is private)
- `GHCR_EMAIL` (optional; used when creating the Kubernetes docker-registry secret)

## Recommended values

### Frontend
- `RUN_DEPLOY=true`
- `FRONTEND_APP_BASE_PATH=/allergen-info/`
- `FRONTEND_API_BASE_URL=https://sub.domain.net/safescan-api`

### Backend
- `VPS_PORT=22`
- `K8S_INGRESS_CLASS=nginx`
- `ASPNETCORE_ENVIRONMENT=Production`
- `PRODUCT_CATALOG_PROVIDER=Placeholder`
- `DABAS_BASE_URL=https://api.dabas.com/`
- `DABAS_API_KEY_QUERY_PARAMETER_NAME=apikey`
- `GHCR_IMAGE_PULL_SECRET_NAME=ghcr-pull-secret`

## Backend environment mapping

The backend deployment writes the following runtime values into Kubernetes ConfigMaps and Secrets:

- `ASPNETCORE_ENVIRONMENT`
- `ProductCatalog__Provider`
- `ProductCatalog__Dabas__BaseUrl`
- `ProductCatalog__Dabas__ApiKey`
- `ProductCatalog__Dabas__ApiKeyHeaderName`
- `ProductCatalog__Dabas__ApiKeyQueryParameterName`
- `AllowedOrigins`

## Security notes

- Do not place backend secrets in frontend variables.
- Treat everything inside the frontend build output as public.
- CORS must be restricted to the frontend domain(s) you actually deploy.
- The public backend ingress should be HTTPS only.
- Kubernetes secrets must not be committed to the repo.
- Workflow logs must not print secret values.

## VPS prerequisites

The VPS is expected to already have:

- `kubectl` configured for the k3s cluster
- nginx ingress running
- cert-manager working
- permission to pull GHCR images, either publicly or through a Kubernetes image pull secret

If the GHCR package is private, the deploy script can create or update the Kubernetes docker-registry pull secret automatically when `GHCR_USERNAME` and `GHCR_TOKEN` are provided as GitHub secrets.

## GHCR image visibility

### Public package
- simplest setup
- no Kubernetes image pull secret required
- omit `GHCR_USERNAME`, `GHCR_TOKEN`, and `GHCR_EMAIL`

### Private package
- requires `GHCR_USERNAME` and `GHCR_TOKEN`
- the backend deploy workflow will create/update the Kubernetes docker-registry secret named by `GHCR_IMAGE_PULL_SECRET_NAME`
- the deployment will reference that pull secret automatically

## Rollback approach

Recommended rollback:
1. identify the previously working image tag from GitHub Actions or GHCR
2. rerun deployment with the older image tag
3. wait for `kubectl rollout status`

## Initial deployment sequence

1. configure GitHub Pages for the repository
2. add all required repository variables and secrets
3. deploy backend first with `PRODUCT_CATALOG_PROVIDER=Placeholder`
4. set `FRONTEND_API_BASE_URL` to the backend public URL
5. deploy frontend
6. switch to `Dabas` later once backend secrets and provider settings are ready
