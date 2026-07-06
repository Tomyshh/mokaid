#!/usr/bin/env bash
# Pushes Mokaid runtime secrets to AWS Secrets Manager (il-central-1).
#
# Usage:
#   aws sso login --profile mokaid          # authenticate first (browser)
#   ./scripts/push-secrets-to-aws.sh
#
# Values are read from the local gitignored .env files so no secret ever
# lives in the repo or in shell history.

set -euo pipefail

PROFILE="${AWS_PROFILE:-mokaid}"
REGION="${AWS_REGION:-il-central-1}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

env_value() { # env_value FILE KEY — tolerates missing or commented-out entries
  grep -E "^(# )?$2=" "$1" 2>/dev/null | tail -1 | cut -d= -f2- || true
}

put_secret() { # put_secret NAME VALUE DESCRIPTION
  local name="$1" value="$2" desc="$3"
  if [ -z "$value" ]; then
    echo "skip  $name (no local value)"
    return
  fi
  if aws secretsmanager describe-secret --secret-id "$name" \
    --profile "$PROFILE" --region "$REGION" > /dev/null 2>&1; then
    aws secretsmanager put-secret-value --secret-id "$name" \
      --secret-string "$value" --profile "$PROFILE" --region "$REGION" > /dev/null
    echo "update $name"
  else
    aws secretsmanager create-secret --name "$name" --description "$desc" \
      --secret-string "$value" --profile "$PROFILE" --region "$REGION" > /dev/null
    echo "create $name"
  fi
}

ANTHROPIC_KEY="$(env_value "$ROOT/apps/ai-worker/.env" ANTHROPIC_API_KEY)"
OPENAI_KEY="$(env_value "$ROOT/apps/ai-worker/.env" OPENAI_API_KEY)"
PAYME_SELLER="$(env_value "$ROOT/apps/api/.env" PAYME_SELLER_ID)"

put_secret "mokaid/anthropic-api-key" "$ANTHROPIC_KEY" "Anthropic API key for the Mokaid AI worker"
put_secret "mokaid/openai-api-key" "$OPENAI_KEY" "OpenAI API key for the Mokaid AI worker"
put_secret "mokaid/payme-seller-id" "$PAYME_SELLER" "PayMe seller id for Mokaid billing"

# Terraform-managed stacks (mokaid-dev / mokaid-staging / mokaid-production)
# create their own suffixed secrets consumed by the ECS task definitions —
# update those too wherever the stack exists.
update_stack_secret() { # update_stack_secret KEY VALUE
  local key="$1" value="$2"
  [ -z "$value" ] && return 0
  aws secretsmanager list-secrets --profile "$PROFILE" --region "$REGION" \
    --query "SecretList[?starts_with(Name, 'mokaid-') && contains(Name, '/$key-')].Name" \
    --output text | tr '\t' '\n' | while read -r name; do
    [ -z "$name" ] && continue
    aws secretsmanager put-secret-value --secret-id "$name" \
      --secret-string "$value" --profile "$PROFILE" --region "$REGION" > /dev/null
    echo "update $name"
  done
}

update_stack_secret "anthropic_api_key" "$ANTHROPIC_KEY"
update_stack_secret "openai_api_key" "$OPENAI_KEY"
update_stack_secret "payme_seller_id" "$PAYME_SELLER"

echo "done — restart ECS services to pick up new values:"
echo "  aws ecs update-service --cluster mokaid-<env> --service mokaid-<env>-api --force-new-deployment"
echo "  aws ecs update-service --cluster mokaid-<env> --service mokaid-<env>-ai-worker --force-new-deployment"
