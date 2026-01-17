#!/bin/bash

# Setup script for the complete CI/CD pipeline
# This script sets up Kind cluster, deploys all services, and configures Jenkins

set -e

echo "🚀 Setting up Mini-Project CI/CD Pipeline..."

# Check prerequisites
export PATH=$HOME/bin:$PATH
command -v kind >/dev/null 2>&1 || { echo "❌ kind is required but not installed. Please install kind first."; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "❌ kubectl is required but not installed. Please install kubectl first."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ docker is required but not installed. Please install docker first."; exit 1; }

# Create Kind cluster
echo "📦 Creating Kind cluster..."
kind create cluster --config kind-cluster.yaml --wait 300s

# Load local images into Kind cluster
echo "📋 Loading images into Kind cluster..."
kind load docker-image frontend:latest
kind load docker-image backend:latest
kind load docker-image agon:latest

# Build Jenkins image
echo "🔨 Building Jenkins image..."
docker build -t jenkins:latest jenkins/
kind load docker-image jenkins:latest

# Create namespaces
echo "🏷️  Creating namespaces..."
kubectl apply -f k8s/namespaces/namespace.yaml

# Deploy MongoDB
echo "🗄️  Deploying MongoDB..."
kubectl apply -f k8s/mongodb/mongodb.yaml
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n mini-project

# Deploy applications
echo "🚀 Deploying applications..."
kubectl apply -f k8s/backend/backend.yaml
kubectl apply -f k8s/frontend/frontend.yaml
kubectl apply -f k8s/agents/agents.yaml

# Deploy monitoring
echo "📊 Deploying monitoring stack..."
kubectl apply -f k8s/monitoring/prometheus.yaml
kubectl apply -f k8s/monitoring/grafana.yaml

# Deploy Jenkins
echo "🔧 Deploying Jenkins..."
kubectl apply -f k8s/jenkins/jenkins.yaml
kubectl wait --for=condition=available --timeout=300s deployment/jenkins -n jenkins

# Wait for all deployments to be ready
echo "⏳ Waiting for all deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/backend -n mini-project
kubectl wait --for=condition=available --timeout=300s deployment/frontend -n mini-project
kubectl wait --for=condition=available --timeout=300s deployment/agents -n mini-project
kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n monitoring
kubectl wait --for=condition=available --timeout=300s deployment/grafana -n monitoring

# Get Jenkins admin password
echo "🔑 Getting Jenkins admin password..."
JENKINS_PASSWORD=$(kubectl exec -n jenkins deployment/jenkins -- cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null || echo "admin123")

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend:        http://localhost:3000"
echo "   Backend API:    http://localhost:4000"
echo "   Agents API:     http://localhost:8000"
echo "   Jenkins:        http://localhost:8081"
echo "   Prometheus:     http://localhost:9090"
echo "   Grafana:        http://localhost:3001"
echo ""
echo "🔐 Jenkins Credentials:"
echo "   Username: admin"
echo "   Password: $JENKINS_PASSWORD"
echo ""
echo "📝 Next Steps:"
echo "1. Access Jenkins at http://localhost:8080"
echo "2. Create a new pipeline job using the Jenkinsfile"
echo "3. Configure GitHub webhook using: ./scripts/setup-github-webhook.sh"
echo "4. Push changes to GitHub to trigger the pipeline"
echo ""
echo "🔧 To teardown the cluster, run: kind delete cluster --name mini-project-cluster"