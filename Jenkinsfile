pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'localhost:5000'
        KUBECONFIG = '/var/jenkins_home/.kube/config'
        NGROK_URL = credentials('ngrok-url')
    }
    
    triggers {
        githubPush()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'docker build -t ${DOCKER_REGISTRY}/frontend:${BUILD_NUMBER} .'
                    sh 'docker push ${DOCKER_REGISTRY}/frontend:${BUILD_NUMBER}'
                }
            }
        }
        
        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh 'docker build -t ${DOCKER_REGISTRY}/backend:${BUILD_NUMBER} .'
                    sh 'docker push ${DOCKER_REGISTRY}/backend:${BUILD_NUMBER}'
                }
            }
        }
        
        stage('Build Agents') {
            steps {
                dir('Agents') {
                    sh 'docker build -t ${DOCKER_REGISTRY}/agon:${BUILD_NUMBER} .'
                    sh 'docker push ${DOCKER_REGISTRY}/agon:${BUILD_NUMBER}'
                }
            }
        }
        
        stage('Deploy to Kubernetes') {
            steps {
                script {
                    // Update frontend deployment
                    sh """
                    kubectl set image deployment/frontend frontend=${DOCKER_REGISTRY}/frontend:${BUILD_NUMBER} -n mini-project
                    kubectl rollout status deployment/frontend -n mini-project
                    """
                    
                    // Update backend deployment
                    sh """
                    kubectl set image deployment/backend backend=${DOCKER_REGISTRY}/backend:${BUILD_NUMBER} -n mini-project
                    kubectl rollout status deployment/backend -n mini-project
                    """
                    
                    // Update agents deployment
                    sh """
                    kubectl set image deployment/agents agents=${DOCKER_REGISTRY}/agon:${BUILD_NUMBER} -n mini-project
                    kubectl rollout status deployment/agents -n mini-project
                    """
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    // Wait for deployments to be ready
                    sh """
                    kubectl wait --for=condition=available --timeout=300s deployment/frontend -n mini-project
                    kubectl wait --for=condition=available --timeout=300s deployment/backend -n mini-project
                    kubectl wait --for=condition=available --timeout=300s deployment/agents -n mini-project
                    """
                    
                    // Test endpoints
                    sh 'curl -f http://frontend.mini-project.svc.cluster.local/ || exit 1'
                    sh 'curl -f http://backend.mini-project.svc.cluster.local/health || exit 1'
                    sh 'curl -f http://agents.mini-project.svc.cluster.local/health || exit 1'
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
            // Update GitHub status
            sh """
            curl -X POST \\
              -H "Authorization: token \${GITHUB_TOKEN}" \\
              -H "Accept: application/vnd.github.v3+json" \\
              https://api.github.com/repos/\${JOB_NAME}/statuses/\${GIT_COMMIT} \\
              -d '{"state":"success","target_url":"\${BUILD_URL}","description":"Deployed to Kubernetes","context":"ci/cd"}'
            """
        }
        failure {
            echo 'Deployment failed!'
            // Update GitHub status
            sh """
            curl -X POST \\
              -H "Authorization: token \${GITHUB_TOKEN}" \\
              -H "Accept: application/vnd.github.v3+json" \\
              https://api.github.com/repos/\${JOB_NAME}/statuses/\${GIT_COMMIT} \\
              -d '{"state":"failure","target_url":"\${BUILD_URL}","description":"Deployment failed","context":"ci/cd"}'
            """
        }
    }
}