#!/usr/bin/env bash
# Configure AWS SSO for mokaid (il-central-1) and log in.
#
# Usage:
#   ./scripts/aws-sso-setup.sh
#   ./scripts/aws-sso-setup.sh <ACCOUNT_ID> <ROLE_NAME>
#
# If ACCOUNT_ID and ROLE_NAME are omitted, runs interactive `aws configure sso`.

set -euo pipefail

SSO_URL="https://ssoins-8316bcac5be35746.portal.il-central-1.app.aws"
REGION="il-central-1"
PROFILE="mokaid"

mkdir -p ~/.aws

if [[ $# -eq 2 ]]; then
  ACCOUNT_ID="$1"
  ROLE_NAME="$2"

  cat > ~/.aws/config <<EOF
[sso-session mokaid]
sso_start_url = ${SSO_URL}
sso_region = ${REGION}
sso_registration_scopes = sso:account:access

[profile ${PROFILE}]
sso_session = mokaid
sso_account_id = ${ACCOUNT_ID}
sso_role_name = ${ROLE_NAME}
region = ${REGION}
output = json
EOF

  echo "Wrote ~/.aws/config for account ${ACCOUNT_ID}, role ${ROLE_NAME}"
else
  echo "Interactive SSO setup — pick your account and role in the portal."
  aws configure sso --profile "${PROFILE}" \
    --sso-session-name mokaid \
    --sso-start-url "${SSO_URL}" \
    --sso-region "${REGION}" \
    --region "${REGION}"
fi

export AWS_PROFILE="${PROFILE}"
aws sso login --profile "${PROFILE}"

echo ""
echo "Verifying identity..."
aws sts get-caller-identity --profile "${PROFILE}"

echo ""
echo "Done. For this shell session:"
echo "  export AWS_PROFILE=${PROFILE}"
