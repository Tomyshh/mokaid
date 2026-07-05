#!/usr/bin/env bash
set -euo pipefail

: "${CLUSTER:?CLUSTER is required}"
: "${TASK_FAMILY:?TASK_FAMILY is required}"
: "${CONTAINER:?CONTAINER is required}"

NETWORK_CONFIG="$(aws ecs describe-services \
  --cluster "${CLUSTER}" \
  --services "${CONTAINER}" \
  --query 'services[0].networkConfiguration' \
  --output json)"

TASK_ARN="$(aws ecs run-task \
  --cluster "${CLUSTER}" \
  --task-definition "${TASK_FAMILY}" \
  --launch-type FARGATE \
  --network-configuration "${NETWORK_CONFIG}" \
  --overrides "$(jq -n --arg NAME "${CONTAINER}" '{
    containerOverrides: [{
      name: $NAME,
      command: ["bin/mokaid", "eval", "Mokaid.Release.migrate()"]
    }]
  }')" \
  --query 'tasks[0].taskArn' \
  --output text)"

echo "Migration task started: ${TASK_ARN}"

aws ecs wait tasks-stopped --cluster "${CLUSTER}" --tasks "${TASK_ARN}"

EXIT_CODE="$(aws ecs describe-tasks \
  --cluster "${CLUSTER}" \
  --tasks "${TASK_ARN}" \
  --query 'tasks[0].containers[0].exitCode' \
  --output text)"

if [ "${EXIT_CODE}" != "0" ]; then
  echo "::error::Migration failed with exit code ${EXIT_CODE}"
  exit 1
fi

echo "Migration completed successfully"
