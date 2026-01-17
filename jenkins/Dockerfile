FROM jenkins/jenkins:lts

USER root

RUN apt-get update && apt-get install -y \
    docker.io \
    kubectl \
    && rm -rf /var/lib/apt/lists/*

RUN usermod -aG docker jenkins

USER jenkins

RUN jenkins-plugin-cli --plugins \
    blueocean \
    git \
    github \
    kubernetes \
    workflow-aggregator \
    pipeline-stage-view \
    build-timeout \
    credentials-binding \
    matrix-auth \
    ws-cleanup

ENV JENKINS_OPTS="--httpPort=8080"

COPY --chown=jenkins:jenkins jenkins.yaml /var/jenkins_home/jenkins.yaml