#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ROOT="${HOME}/deployments/safescan"
BUNDLE_PATH="/tmp/backend-deploy-bundle.tar.gz"

mkdir -p "${DEPLOY_ROOT}"
tar -xzf "${BUNDLE_PATH}" -C "${DEPLOY_ROOT}" --strip-components=2

# Hard-coded deployment values (explicit as requested)
export BACKEND_K8S_NAMESPACE="brightroom"
export BACKEND_K8S_DEPLOYMENT_NAME="safescan-api"
export BACKEND_K8S_SERVICE_NAME="safescan-api"
export BACKEND_K8S_INGRESS_NAME="brightroom-ingress"
export BACKEND_CONTAINER_PORT="8080"
export BACKEND_PATH_PREFIX="/safescan-api"
export BACKEND_ASPNETCORE_PATH_BASE="/safescan-api"
export K8S_INGRESS_CLASS="nginx"
export ASPNETCORE_ENVIRONMENT="Production"
export DABAS_BASE_URL="https://api.dabas.com/"
export DABAS_API_KEY_QUERY_PARAMETER_NAME="apikey"
export BACKEND_HOST="hub.brightmatter.net"
export BACKEND_TLS_SECRET_NAME="brightroom-tls"

if [[ -z "${IMAGE_REF:-}" ]]; then
  echo "IMAGE_REF is required" >&2
  exit 1
fi

# BACKEND_HOST is hard-coded above; no runtime requirement check needed here.
# Ingress is managed externally; deploy does not create or modify ingress resources.

export IMAGE_REF
export BACKEND_HOST
export BACKEND_TLS_SECRET_NAME
export PRODUCT_CATALOG_PROVIDER="${PRODUCT_CATALOG_PROVIDER:-Dabas}"
export CERT_MANAGER_CLUSTER_ISSUER="${CERT_MANAGER_CLUSTER_ISSUER:-}"
export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-}"
export DABAS_API_KEY="${DABAS_API_KEY:-}"
export DABAS_API_KEY_HEADER_NAME="${DABAS_API_KEY_HEADER_NAME:-}"
export GHCR_USERNAME="${GHCR_USERNAME:-}"
export GHCR_TOKEN="${GHCR_TOKEN:-}"
export GHCR_EMAIL="${GHCR_EMAIL:-actions@github.com}"
export GHCR_IMAGE_PULL_SECRET_NAME="${GHCR_IMAGE_PULL_SECRET_NAME:-ghcr-pull-secret}"

cd "${DEPLOY_ROOT}"

kubectl create namespace "${BACKEND_K8S_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

if [[ -n "${GHCR_USERNAME}" && -n "${GHCR_TOKEN}" ]]; then
  kubectl -n "${BACKEND_K8S_NAMESPACE}" create secret docker-registry "${GHCR_IMAGE_PULL_SECRET_NAME}" \
    --docker-server="ghcr.io" \
    --docker-username="${GHCR_USERNAME}" \
    --docker-password="${GHCR_TOKEN}" \
    --docker-email="${GHCR_EMAIL}" \
    --dry-run=client -o yaml | kubectl apply -f -
fi

IMAGE_PULL_SECRETS_BLOCK=""
if [[ -n "${GHCR_USERNAME}" && -n "${GHCR_TOKEN}" ]]; then
  IMAGE_PULL_SECRETS_BLOCK=$(cat <<EOF
      imagePullSecrets:
        - name: ${GHCR_IMAGE_PULL_SECRET_NAME}
EOF
)
fi

kubectl -n "${BACKEND_K8S_NAMESPACE}" create secret generic "${BACKEND_K8S_DEPLOYMENT_NAME}-secrets" \
  --from-literal=ProductCatalog__Dabas__ApiKey="${DABAS_API_KEY}" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl -n "${BACKEND_K8S_NAMESPACE}" create configmap "${BACKEND_K8S_DEPLOYMENT_NAME}-config" \
  --from-literal=ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT}" \
  --from-literal=PathBase="${BACKEND_ASPNETCORE_PATH_BASE}" \
  --from-literal=ProductCatalog__Provider="${PRODUCT_CATALOG_PROVIDER}" \
  --from-literal=ProductCatalog__Dabas__BaseUrl="${DABAS_BASE_URL}" \
  --from-literal=ProductCatalog__Dabas__ApiKeyHeaderName="${DABAS_API_KEY_HEADER_NAME}" \
  --from-literal=ProductCatalog__Dabas__ApiKeyQueryParameterName="${DABAS_API_KEY_QUERY_PARAMETER_NAME}" \
  --from-literal=AllowedOrigins="${ALLOWED_ORIGINS}" \
  --dry-run=client -o yaml | kubectl apply -f -

cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${BACKEND_K8S_DEPLOYMENT_NAME}
  namespace: ${BACKEND_K8S_NAMESPACE}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${BACKEND_K8S_DEPLOYMENT_NAME}
  template:
    metadata:
      labels:
        app: ${BACKEND_K8S_DEPLOYMENT_NAME}
    spec:
${IMAGE_PULL_SECRETS_BLOCK}
      containers:
        - name: api
          image: ${IMAGE_REF}
          imagePullPolicy: Always
          ports:
            - containerPort: ${BACKEND_CONTAINER_PORT}
              name: http
          envFrom:
            - configMapRef:
                name: ${BACKEND_K8S_DEPLOYMENT_NAME}-config
            - secretRef:
                name: ${BACKEND_K8S_DEPLOYMENT_NAME}-secrets
          readinessProbe:
            httpGet:
              path: ${BACKEND_ASPNETCORE_PATH_BASE}/health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: ${BACKEND_ASPNETCORE_PATH_BASE}/health
              port: http
            initialDelaySeconds: 20
            periodSeconds: 20
EOF

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: ${BACKEND_K8S_SERVICE_NAME}
  namespace: ${BACKEND_K8S_NAMESPACE}
spec:
  selector:
    app: ${BACKEND_K8S_DEPLOYMENT_NAME}
  ports:
    - port: 8080
      targetPort: http
      protocol: TCP
      name: http
EOF

# Ingress is managed outside this script. No ingress resources will be created or modified.

kubectl -n "${BACKEND_K8S_NAMESPACE}" rollout status deployment/"${BACKEND_K8S_DEPLOYMENT_NAME}" --timeout=180s

echo ""
echo "=== Deployment Status ==="
kubectl get deployment,service,ingress -n "${BACKEND_K8S_NAMESPACE}"

echo ""
echo "=== Pod Details ==="
kubectl get pods -n "${BACKEND_K8S_NAMESPACE}" -o wide

echo ""
echo "=== Recent Events ==="
kubectl get events -n "${BACKEND_K8S_NAMESPACE}" --sort-by='.lastTimestamp' | tail -20 || true
