# Mini-Project CI/CD Pipeline

This project includes a complete CI/CD pipeline setup using Kind (Kubernetes in Docker), Jenkins, and GitHub webhooks.

## 🏗️ Architecture

- **Kind Cluster**: Local Kubernetes cluster
- **Jenkins**: CI/CD automation server
- **GitHub Webhooks**: Trigger builds on push events
- **Kubernetes**: Application deployment and scaling
- **Docker Registry**: Container image storage

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Ngrok](https://ngrok.com/) (for external Jenkins access)

### Setup

1. **Clone and setup the pipeline**:
   ```bash
   ./scripts/setup-pipeline.sh
   ```

2. **Configure Jenkins**:
   - Access Jenkins at http://localhost:8080
   - Login with username: `admin`, password: shown in setup output
   - Create a new pipeline job
   - Configure it to use the `Jenkinsfile` from your repository

3. **Setup GitHub Webhook**:
   ```bash
   export GITHUB_TOKEN=your_github_personal_access_token
   ./scripts/setup-github-webhook.sh
   ```

4. **Test the pipeline**:
   - Make a change to your code
   - Push to GitHub
   - Watch Jenkins automatically build and deploy!

## 📁 Project Structure

```
├── k8s/                    # Kubernetes manifests
│   ├── namespaces/        # Namespace configurations
│   ├── mongodb/          # MongoDB deployment
│   ├── backend/          # Backend API deployment
│   ├── frontend/         # Frontend deployment
│   ├── agents/           # Agents service deployment
│   ├── jenkins/          # Jenkins deployment
│   └── monitoring/       # Prometheus & Grafana
├── jenkins/              # Jenkins configuration
│   ├── Dockerfile        # Custom Jenkins image
│   └── jenkins.yaml      # Jenkins configuration
├── scripts/              # Setup and utility scripts
│   ├── setup-pipeline.sh    # Complete pipeline setup
│   ├── teardown-pipeline.sh  # Cleanup script
│   └── setup-github-webhook.sh # Webhook configuration
├── Jenkinsfile           # CI/CD pipeline definition
└── kind-cluster.yaml     # Kind cluster configuration
```

## 🔧 Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React application |
| Backend API | http://localhost:4000 | Node.js API server |
| Agents API | http://localhost:8000 | Python FastAPI service |
| Jenkins | http://localhost:8080 | CI/CD pipeline server |
| Prometheus | http://localhost:9090 | Metrics monitoring |
| Grafana | http://localhost:3001 | Visualization dashboard |

## 🔄 CI/CD Pipeline Flow

1. **GitHub Push** → Triggers webhook
2. **Jenkins Build** → Checks out code
3. **Docker Build** → Creates container images
4. **Kubernetes Deploy** → Updates deployments
5. **Health Check** → Verifies deployment success

## 🛠️ Manual Operations

### Deploy individual services
```bash
# Deploy backend only
kubectl apply -f k8s/backend/backend.yaml

# Check deployment status
kubectl get deployments -n mini-project
```

### View logs
```bash
# Jenkins logs
kubectl logs -n jenkins deployment/jenkins -f

# Application logs
kubectl logs -n mini-project deployment/backend -f
```

### Scale applications
```bash
# Scale backend to 3 replicas
kubectl scale deployment backend --replicas=3 -n mini-project
```

## 🧹 Cleanup

To remove the entire setup:
```bash
./scripts/teardown-pipeline.sh
```

## 🔍 Troubleshooting

### Jenkins not accessible
- Check if Jenkins pod is running: `kubectl get pods -n jenkins`
- Check port forwarding: `kubectl port-forward svc/jenkins 8080:8080 -n jenkins`

### Build failures
- Check Jenkins logs for detailed error messages
- Verify Docker images are built correctly
- Check Kubernetes deployment status

### Webhook not triggering
- Verify GitHub webhook is configured correctly
- Check if Jenkins is accessible from GitHub
- Verify webhook URL is correct

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub personal access token | Required |
| `JENKINS_URL` | Jenkins server URL | http://localhost:8080 |
| `DOCKER_REGISTRY` | Docker registry URL | localhost:5000 |

## 🚀 Next Steps

- Add automated testing to the pipeline
- Configure staging and production environments
- Set up monitoring and alerting
- Add rollback mechanisms
- Implement blue-green deployments