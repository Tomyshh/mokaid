#!/usr/bin/env bash
# Build, push, and deploy the mokaid web SPA to ECS (requires AWS CLI credentials).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV="${1:-dev}"
IMAGE_TAG="${2:-$(git -C "${ROOT}" rev-parse HEAD)}"
AWS_REGION="${AWS_REGION:-il-central-1}"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE="${REGISTRY}/mokaid-web:${IMAGE_TAG}"

echo "==> Logging in to ECR"
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${REGISTRY}"

echo "==> Building web assets locally"
VITE_API_URL= VITE_WS_URL=/socket npm run build --workspace=apps/web --prefix "${ROOT}"

echo "==> Building runtime image (${IMAGE_TAG})"
docker build \
  --file "${ROOT}/infra/docker/web.runtime.Dockerfile" \
  --tag "${IMAGE}" \
  "${ROOT}"

docker push "${IMAGE}"

echo "==> Applying Terraform (web service + ALB routing)"
cd "${ROOT}/infra/terraform/environments/${ENV}"
terraform init -input=false
terraform apply -auto-approve \
  -var="web_image_tag=${IMAGE_TAG}"

echo "==> Rolling ECS service"
CLUSTER="mokaid-${ENV}"
SERVICE="mokaid-${ENV}-web"
export CLUSTER SERVICE TASK_FAMILY="${SERVICE}" IMAGE
"${ROOT}/.github/scripts/deploy-ecs-service.sh"

ALB_DNS="$(terraform output -raw alb_dns_name)"
echo ""
echo "Deployed web to http://${ALB_DNS}/"
