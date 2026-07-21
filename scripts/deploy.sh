#!/bin/bash
set -euo pipefail

# Configuration
AWS_REGION="ap-northeast-1"
AWS_ACCOUNT_ID="118690287046"
REPOSITORY_NAME="personal-docs-web"

# Use the secret name or full secret ARN
SECRET_ID="personal-webapp-env"

CONTAINER_NAME="personal-docs-web"
ENV_FILE="/etc/personal-docs-web.env"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IMAGE_TAG="$(cat "$SCRIPT_DIR/../image-tag.txt")"

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_URI="${ECR_REGISTRY}/${REPOSITORY_NAME}:${IMAGE_TAG}"

create_runtime_env_file() {
  local secret_json
  local temporary_env_file

  temporary_env_file="$(mktemp)"

  echo "Retrieving runtime configuration from AWS Secrets Manager..."

  secret_json="$(
    aws secretsmanager get-secret-value \
      --region "$AWS_REGION" \
      --secret-id "$SECRET_ID" \
      --query SecretString \
      --output text
  )"

  if [ -z "$secret_json" ] || [ "$secret_json" = "None" ]; then
    echo "SecretString is empty for secret: $SECRET_ID" >&2
    rm -f "$temporary_env_file"
    exit 1
  fi

  # jq -r outputs the raw values without JSON quotation marks.
  jq -r '
    def required($name):
      .[$name]
      | if . == null or . == ""
        then error($name + " is missing or empty")
        else .
        end;

    "DOCS_API_BASE_URL=\(required("DOCS_API_BASE_URL"))",
    "DOCS_API_KEY=\(required("DOCS_API_KEY"))",
    "DOCS_API_AUTHORIZATION=\(required("DOCS_API_AUTHORIZATION"))"
  ' <<< "$secret_json" > "$temporary_env_file"

  # Only root can read or modify the file.
  chown root:root "$temporary_env_file"
  chmod 600 "$temporary_env_file"

  mv "$temporary_env_file" "$ENV_FILE"

  echo "Runtime environment file created."
}

wait_for_container_health() {
  local attempts=0
  local status

  while [ "$attempts" -lt 20 ]; do
    status="$(
      docker inspect \
        --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
        "$CONTAINER_NAME" 2>/dev/null || true
    )"

    if [ "$status" = "healthy" ]; then
      return 0
    fi

    if [ "$status" = "unhealthy" ] || [ "$status" = "none" ]; then
      echo "Container health check failed with status: $status" >&2
      return 1
    fi

    sleep 2
    attempts=$((attempts + 1))
  done

  echo "Container did not become healthy before the deployment timeout." >&2
  return 1
}

echo "Script directory: $SCRIPT_DIR"
echo "Deployment contents:"
ls -la "$SCRIPT_DIR/.."

# Retrieve the latest secret before starting the container.
create_runtime_env_file

echo "Logging into Amazon ECR..."
aws ecr get-login-password --region "$AWS_REGION" |
  docker login \
    --username AWS \
    --password-stdin "$ECR_REGISTRY"

echo "Pulling image: $ECR_URI"
docker pull "$ECR_URI"

echo "Stopping existing container..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

echo "Starting new container..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p 80:3000 \
  --env-file "$ENV_FILE" \
  "$ECR_URI"

if ! wait_for_container_health; then
  docker logs --tail 100 "$CONTAINER_NAME" || true
  docker rm -f "$CONTAINER_NAME" || true
  exit 1
fi

echo "Deployment complete."