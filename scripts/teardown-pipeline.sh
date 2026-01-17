#!/bin/bash

# Teardown script for the CI/CD pipeline
# This script removes the Kind cluster and all associated resources

set -e

echo "🧹 Tearing down Mini-Project CI/CD Pipeline..."

# Delete Kind cluster
echo "🗑️  Deleting Kind cluster..."
kind delete cluster --name mini-project-cluster

echo ""
echo "✅ Teardown completed successfully!"
echo ""
echo "All resources have been removed from the Kind cluster."