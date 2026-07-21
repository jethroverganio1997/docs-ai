#!/bin/bash
set -e

# Configuration
AWS_REGION="ap-northeast-1"
AWS_ACCOUNT_ID="118690287046"
REPOSITORY_NAME="personal-docs-web"
IMAGE_TAG="latest"

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_URI="${ECR_REGISTRY}/${REPOSITORY_NAME}:${IMAGE_TAG}"

CONTAINER_NAME="personal-docs-web"

echo "Logging into Amazon ECR..."
aws ecr get-login-password --region "$AWS_REGION" \
| docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo "Pulling latest image..."
docker pull "$ECR_URI"

echo "Stopping existing container..."
docker stop "$CONTAINER_NAME" || true
docker rm "$CONTAINER_NAME" || true

echo "Starting new container..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p 80:3000 \
  "$ECR_URI"

echo "Deployment complete."