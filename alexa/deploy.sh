#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAMBDA_DIR="$SCRIPT_DIR/lambda"
FUNCTION_NAME="${LAMBDA_FUNCTION_NAME:-koel-alexa-skill}"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_PROFILE_ARG=""

usage() {
  cat <<EOF
Usage: $0 [OPTIONS] COMMAND

Commands:
  package       Build the deployment package (lambda.zip)
  create        Create the Lambda function
  update        Update the Lambda function code
  create-table  Create the DynamoDB table

Options:
  --profile NAME    AWS CLI named profile to use
  --region REGION   AWS region (default: us-east-1)
  --function NAME   Lambda function name (default: koel-alexa-skill)
  -h, --help        Show this help message

Environment variables:
  LAMBDA_ROLE_ARN       Required for 'create'. IAM role ARN for the Lambda.
  KOEL_BASE_URL         Your Koel instance URL (e.g. https://koel.example.com)
  DYNAMO_TABLE_NAME     DynamoDB table name (default: KoelAlexaPlaybackState)

Examples:
  $0 --profile personal package
  $0 --profile personal --region eu-west-1 create
  $0 --profile personal update
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --profile) AWS_PROFILE_ARG="--profile $2"; shift 2 ;;
    --region) AWS_REGION="$2"; shift 2 ;;
    --function) FUNCTION_NAME="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) COMMAND="$1"; shift ;;
  esac
done

COMMAND="${COMMAND:-}"

if [[ -z "$COMMAND" ]]; then
  echo "Error: No command specified. Run '$0 --help' for usage."
  exit 1
fi

package() {
  echo "==> Installing production dependencies..."
  cd "$LAMBDA_DIR"
  npm ci --omit=dev

  echo "==> Creating deployment package..."
  rm -f "$SCRIPT_DIR/lambda.zip"
  zip -r "$SCRIPT_DIR/lambda.zip" . -x "__tests__/*" "*.test.*" ".gitignore"

  echo "==> Package created: $SCRIPT_DIR/lambda.zip"
  echo "    Size: $(du -h "$SCRIPT_DIR/lambda.zip" | cut -f1)"
}

create_function() {
  if [[ -z "${LAMBDA_ROLE_ARN:-}" ]]; then
    echo "Error: LAMBDA_ROLE_ARN environment variable is required for 'create'."
    echo "Example: LAMBDA_ROLE_ARN=arn:aws:iam::123456789012:role/koel-alexa-role $0 create"
    exit 1
  fi

  if [[ ! -f "$SCRIPT_DIR/lambda.zip" ]]; then
    echo "==> No lambda.zip found, building package first..."
    package
  fi

  echo "==> Creating Lambda function: $FUNCTION_NAME"
  # shellcheck disable=SC2086
  aws lambda create-function \
    $AWS_PROFILE_ARG \
    --region "$AWS_REGION" \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs20.x \
    --handler index.handler \
    --role "$LAMBDA_ROLE_ARN" \
    --zip-file "fileb://$SCRIPT_DIR/lambda.zip" \
    --timeout 10 \
    --memory-size 256 \
    --environment "Variables={KOEL_BASE_URL=${KOEL_BASE_URL:-},DYNAMO_TABLE_NAME=${DYNAMO_TABLE_NAME:-KoelAlexaPlaybackState}}"

  echo "==> Lambda function created successfully."
  echo "    Add an Alexa Skills Kit trigger in the AWS console to connect it to your skill."
}

update_function() {
  if [[ ! -f "$SCRIPT_DIR/lambda.zip" ]]; then
    echo "==> No lambda.zip found, building package first..."
    package
  fi

  echo "==> Updating Lambda function: $FUNCTION_NAME"
  # shellcheck disable=SC2086
  aws lambda update-function-code \
    $AWS_PROFILE_ARG \
    --region "$AWS_REGION" \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$SCRIPT_DIR/lambda.zip"

  echo "==> Lambda function updated successfully."
}

create_table() {
  local table_name="${DYNAMO_TABLE_NAME:-KoelAlexaPlaybackState}"

  echo "==> Creating DynamoDB table: $table_name"
  # shellcheck disable=SC2086
  aws dynamodb create-table \
    $AWS_PROFILE_ARG \
    --region "$AWS_REGION" \
    --table-name "$table_name" \
    --attribute-definitions AttributeName=userId,AttributeType=S \
    --key-schema AttributeName=userId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

  echo "==> DynamoDB table created successfully."
}

case "$COMMAND" in
  package)      package ;;
  create)       create_function ;;
  update)       update_function ;;
  create-table) create_table ;;
  *)
    echo "Error: Unknown command '$COMMAND'. Run '$0 --help' for usage."
    exit 1
    ;;
esac
