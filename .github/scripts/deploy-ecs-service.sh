#!/usr/bin/env bash
set -euo pipefail

: "${CLUSTER:?CLUSTER is required}"
: "${SERVICE:?SERVICE is required}"
: "${TASK_FAMILY:?TASK_FAMILY is required}"
: "${IMAGE:?IMAGE is required}"

TASK_DEF="$(aws ecs describe-task-definition \
  --task-definition "${TASK_FAMILY}" \
  --query taskDefinition)"

NEW_TASK_DEF="$(echo "${TASK_DEF}" | jq --arg IMAGE "${IMAGE}" '
  .containerDefinitions[0].image = $IMAGE
  | del(
      .taskDefinitionArn,
      .revision,
      .status,
      .requiresAttributes,
      .compatibilities,
      .registeredAt,
      .registeredBy
    )
')"

NEW_ARN="$(aws ecs register-task-definition \
  --cli-input-json "${NEW_TASK_DEF}" \
  --query taskDefinition.taskDefinitionArn \
  --output text)"

aws ecs update-service \
  --cluster "${CLUSTER}" \
  --service "${SERVICE}" \
  --task-definition "${NEW_ARN}" \
  --force-new-deployment \
  --query 'service.serviceName' \
  --output text

aws ecs wait services-stable --cluster "${CLUSTER}" --services "${SERVICE}"

echo "Deployed ${SERVICE} with ${IMAGE}"
