#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ROOT="${HOME}/deployments/safescan"
BUNDLE_PATH="/tmp/backend-deploy-bundle.tar.gz"

mkdir -p "${DEPLOY_ROOT}"
tar -xzf "${BUNDLE_PATH}" -C "${DEPLOY_ROOT}" --strip-components=2

export BACKEND_K8S_NAMESPACE="${BACKEND_K8S_NAMESPACE:-safescan}"
export BACKEND_K8S_DEPLOYMENT_NAME="${BACKEND_K8S_DEPLOYMENT_NAME:-safescan-api}"
export BACKEND_K8S_SERVICE_NAME="${BACKEND_K8S_SERVICE_NAME:-safescan-api}"
export BACKEND_K8S_INGRESS_NAME="${BACKEND_K8S_INGRESS_NAME:-safescan-api}"
export BACKEND_CONTAINER_PORT="${BACKEND_CONTAINER_PORT:-8080}"
export BACKEND_PATH_PREFIX="${BACKEND_PATH_PREFIX:-/}"
export K8S_INGRESS_CLASS="${K8S_INGRESS_CLASS:-nginx}"
export PRODUCT_CATALOG_PROVIDER="${PRODUCT_CATALOG_PROVIDER:-Placeholder}"
export ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT:-Production}"
export DABAS_BASE_URL="${DABAS_BASE_URL:-https://api.dabas.com/}"
export DABAS_API_KEY_QUERY_PARAMETER_NAME="${DABAS_API_KEY_QUERY_PARAMETER_NAME:-apikey}"

if [[ -z "${IMAGE_REF:-}" ]]; then
  echo "IMAGE_REF is required" >&2
  exit 1
fi

if [[ -z "${BACKEND_HOST:-}" ]]; then
  echo "BACKEND_HOST is required" >&2
  exit 1
fi

if [[ -z "${BACKEND_TLS_SECRET_NAME:-}" ]]; then
  echo "BACKEND_TLS_SECRET_NAME is required" >&2
  exit 1
fi

export IMAGE_REF
export BACKEND_HOST
export BACKEND_TLS_SECRET_NAME
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
              path: /health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
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
    - port: 80
      targetPort: http
      protocol: TCP
      name: http
EOF

cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${BACKEND_K8S_INGRESS_NAME}
  namespace: ${BACKEND_K8S_NAMESPACE}
  annotations:
    kubernetes.io/ingress.class: ${K8S_INGRESS_CLASS}
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/force-ssl-redirect: 'true'
    nginx.ingress.kubernetes.io/proxy-body-size: 1m
    nginx.ingress.kubernetes.io/proxy-read-timeout: '60'
    nginx.ingress.kubernetes.io/proxy-send-timeout: '60'
    cert-manager.io/cluster-issuer: ${CERT_MANAGER_CLUSTER_ISSUER}
spec:
  ingressClassName: ${K8S_INGRESS_CLASS}
  tls:
    - hosts:
        - ${BACKEND_HOST}
      secretName: ${BACKEND_TLS_SECRET_NAME}
  rules:
    - host: ${BACKEND_HOST}
      http:
        paths:
          - path: ${BACKEND_PATH_PREFIX}
            pathType: Prefix
            backend:
              service:
                name: ${BACKEND_K8S_SERVICE_NAME}
                port:
                  number: 80
EOF

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
