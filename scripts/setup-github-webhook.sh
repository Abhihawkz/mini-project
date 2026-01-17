#!/bin/bash

# GitHub Webhook Setup Script
# This script sets up GitHub webhooks to trigger Jenkins builds

set -e

# Configuration
GITHUB_REPO="${GITHUB_REPO:-$(git config --get remote.origin.url | sed 's/.*:\\/\\//g' | sed 's/\\.git//g')}"
JENKINS_URL="${JENKINS_URL:-http://localhost:8080}"
WEBHOOK_URL="${WEBHOOK_URL:-${JENKINS_URL}/github-webhook/}"
GITHUB_TOKEN="${GITHUB_TOKEN}"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is required"
    echo "Please set your GitHub personal access token"
    exit 1
fi

echo "Setting up webhook for repository: $GITHUB_REPO"
echo "Webhook URL: $WEBHOOK_URL"

# Create webhook
curl -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/$GITHUB_REPO/hooks \
    -d "{
        \"name\": \"web\",
        \"active\": true,
        \"events\": [\"push\"],
        \"config\": {
            \"url\": \"$WEBHOOK_URL\",
            \"content_type\": \"json\",
            \"insecure_ssl\": \"true\"
        }
    }"

echo ""
echo "Webhook created successfully!"
echo "Make sure Jenkins is running and accessible at: $JENKINS_URL"