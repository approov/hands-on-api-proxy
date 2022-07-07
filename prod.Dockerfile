FROM node:12-slim as Build

ARG BUILD_RELEASE_FROM=master

ENV USER="node"
ENV HOME="/home/${USER}"
ENV GIT_BARE_DIR="${HOME}/git-bare"
ENV ASTROPIKS_DIR="${HOME}/astropiks"
ENV PROXY_DIR="${ASTROPIKS_DIR}/src/proxy/nodejs"

RUN apt update && apt -y upgrade && \
    apt -y install \
        locales \
        git \
        curl && \

    echo "${LOCALIZATION} ${ENCODING}" > /etc/locale.gen && \
    locale-gen "${LOCALIZATION}"

# We should never run containers as root, just like we do not run as root in our PCs and production servers.
# Everything from this line onwards will run in the context of the unprivileged user.
USER "${USER}"

# We need to explicitly create the app dir to have the user `node` ownership, otherwise will have `root` ownership.
RUN mkdir -p "${ASTROPIKS_DIR}"

WORKDIR "${GIT_BARE_DIR}"

COPY --chown="${USER}:${USER}" ./ .

RUN \
  git config --global user.email "you@example.com" && \
  git config --global user.name "Your Name" && \
  git status && \
  git add --all && \
  git commit -m 'commit changed files and untracked files just in case we will build from current branch.' || true && \
  git clone --local "${GIT_BARE_DIR}" "${ASTROPIKS_DIR}" && \
  cd "${ASTROPIKS_DIR}" && \
  git checkout "${BUILD_RELEASE_FROM}"

WORKDIR "${PROXY_DIR}"

RUN npm install && \
  npm run build && \
  npm ci --only=production


FROM node:12-slim

ENV USER="node"
ENV HOME="/home/${USER}"
ENV ASTROPIKS_DIR="${HOME}/astropiks"
ENV PROXY_DIR="${ASTROPIKS_DIR}/src/proxy/nodejs"

USER "${USER}"

WORKDIR "${HOME}"/app

COPY --chown="${USER}:${USER}" --from=Build "${PROXY_DIR}"/package.json ./package.json
COPY --chown="${USER}:${USER}" --from=Build "${PROXY_DIR}"/node_modules ./node_modules
COPY --chown="${USER}:${USER}" --from=Build "${PROXY_DIR}"/robots.txt ./dist/robots.txt
COPY --chown="${USER}:${USER}" --from=Build "${PROXY_DIR}"/dist ./dist

CMD [ "npm", "run", "serve" ]
