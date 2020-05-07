FROM node:alpine

ARG DOCKER_BUILD="/docker-build"
ARG DOCKER_BUILD_SCRIPTS_RELEASE="0.0.1.0"
ARG CONTAINER_USER_NAME="node"
ENV CONTAINER_HOME=/home/"${CONTAINER_USER_NAME}"
ENV WORKSPACE_PATH="${CONTAINER_HOME}/workspace"

COPY ./.certificates /.certificates

RUN apk add \
        ca-certificates \
        openssl \
        openssh-client \
        curl \
        python3 \
        make \
        g++ && \

    mkdir -p "${DOCKER_BUILD}" && \

    curl \
        -fsSl \
        -o archive.tar.gz https://gitlab.com/exadra37-bash/docker/bash-scripts-for-docker-builds/-/archive/"${DOCKER_BUILD_SCRIPTS_RELEASE}"/bash-scripts-for-docker-builds-dev.tar.gz?path=scripts && \
    tar xf archive.tar.gz -C "${DOCKER_BUILD}" --strip 1 && \
    rm -vf archive.tar.gz

RUN \
    if [ -f "/.certificates/ProxyCA.crt" ]; then \
        "${DOCKER_BUILD}"/scripts/custom-ssl/operating-system/add-custom-authority-certificate.sh \
          "/.certificates/ProxyCA.crt" \
          "/usr/local/share/ca-certificates"; \
    fi

RUN  \
    if [ -f "/.certificates/ProxyCA.crt" ]; then \
        "${DOCKER_BUILD}"/scripts/custom-ssl/nodejs/add-certificate-to-server.sh \
            "/etc/ssl/certs/ca-cert-ProxyCA.pem" \
            "${CONTAINER_HOME}"; \
    fi && \

    "${DOCKER_BUILD}"/scripts/utils/create-workspace-dir.sh \
        "${WORKSPACE_PATH}" \
        "${CONTAINER_USER_NAME}"

USER node

WORKDIR /home/node/workspace

CMD ["sh"]
