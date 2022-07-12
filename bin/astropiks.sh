#!/bin/sh

set -eu

Show_Help() {
  cat <<EOF

  A bash script to deploy, via ssh, the server in a docker container, that
  is then served by Traefik.


  SYNOPSIS:

  $ ./astropiks [options]


  OPTIONS:

  --env           Sets the deployment enviroment (defaults to local):
                  $ ./astropiks --env dev
                  $ ./astropiks --env staging
                  $ ./astropiks --env rc
                  $ ./astropiks --env prod

  --env-type      Sets the deployment enviroment type (defaults to remote):
                  $ ./astropiks --env-type
                  $ ./astropiks --env-type local
                  $ ./astropiks --env-type remote

  --from          Sets the git branch/tag for the release (defaults to master):
                  $ ./astropiks --from feature
                  $ ./astropiks --from 1.0.0

  --from-current  Sets the release to the current git branch/tag:
                  $ ./astropiks --from-current

  --release-tag   Sets a numeric tag for the release (defaults to none):
                  $ ./astropiks --release-tag 1



  COMMANDS:

  build           Builds the docker image for an environment (defaults: --from master):
                  $ ./astropiks build local
                  $ ./astropiks --from-current build dev
                  $ ./astropiks --from feature_branch build rc
                  $ ./astropiks --from git_tag build prod

  copy-env        Copies the remote .env to ./.local/deploy (defaults: --env local):
                  $ ./astropiks copy-env
                  $ ./astropiks --env staging copy-env
                  $ ./astropiks --env prod copy-env

  update-env      Updates the local env deploy file from the .env remote file (defaults: --env local):
                  $ ./astropiks update-env
                  $ ./astropiks --env staging update-env
                  $ ./astropiks --env prod update-env

  deploy          Deploys a release (defaults: --env local, --env-type remote, --from master):
                  $ ./astropiks --from-current deploy
                  $ ./astropiks --env staging --from branch-name deploy
                  $ ./astropiks --env staging --env-type remote --from branch-name deploy
                  $ ./astropiks --env staging --env-type local --from branch-name deploy
                  $ ./astropiks --env prod deploy

  logs            Tails the logs on the remote server:
                  $ ./astropiks logs
                  $ ./astropiks --env prod logs

  down            Shutdown the Server for the given environment:
                  $ ./astropiks down dev
                  $ ./astropiks down tes
                  $ ./astropiks down staging
                  $ ./astropiks down rc

  up              Boots the Server for the given environment:
                  $ ./astropiks up dev
                  $ ./astropiks up test
                  $ ./astropiks up staging
                  $ ./astropiks up rc

  rsync           Synchronizes the source code with the remote env:
                  $ ./astropiks --env dev rsync
                  $ ./astropiks --env dev --release-tag 1 rsync

  shell           Starts a container with a shell for an environment (defaults: --env local):
                  $ ./astropiks shell
                  $ ./astropiks --env rc shell

EOF
}

Exit_With_Error() {
  echo "\n---> ERROR: ${1? Missing exit error message...}\n"
  exit 1
}

Setup_Configuration() {

  if [ "${SETUP_CONFIG_DONE}" != "false" ]; then
    return
  fi

  if [ -f "${ENV_DEPLOY_FILE}" ]; then
    local tag=${RELEASE_TAG}
    local branch=${BUILD_RELEASE_FROM}

    . "./${ENV_DEPLOY_FILE}"

    # Fixes the option --release-tag being overridden by the one in ENV_DEPLOY_FILE
    RELEASE_TAG="${tag}"
    BUILD_RELEASE_FROM="${branch}"

    [ -z ${REMOTE_USER:-} ] && Exit_With_Error "REMOTE_USER - ${ENV_ERROR}"
  else
    Exit_With_Error "Missing the ${ENV_DEPLOY_FILE} file. Add it as per DEPLOYMENT.md instructions."
  fi

  case "${RELEASE_ENV}" in
    "local" | "dev" | "test" | "staging" | "rc" )
      # The public domain will look like: rc1.astropiks.demo.approov.io
      TRAEFIK_PUBLIC_DOMAIN="${RELEASE_ENV}${RELEASE_TAG}".${APP_NAME}.${SERVER_PUBLIC_DOMAIN}
    ;;

    "prod" )
      # The public domain will look like: astropiks.demo.approov.io
      TRAEFIK_PUBLIC_DOMAIN=${APP_NAME}.${SERVER_PUBLIC_DOMAIN}
    ;;

    * )
      Exit_With_Error "Invalid value [${RELEASE_ENV}] for --env flag. Please provide one of dev, staging, rc or prod."
  esac

  REMOTE_HOME="/home/${REMOTE_USER}"
  REMOTE_APP_DIR="${REMOTE_HOME}/${APP_NAME}/${TRAEFIK_PUBLIC_DOMAIN}"
  DOMAINS="${TRAEFIK_PUBLIC_DOMAIN}"
  REMOTE_DOCKER_IMAGE="${TRAEFIK_PUBLIC_DOMAIN}:${DATETIME}"

  SETUP_CONFIG_DONE="true"
}

Npm_Install_Local_Server() {
  if [ ! -d "./src/proxy/nodejs/node_modules" ]; then
    sudo docker-compose run --rm local sh -c 'npm install && exit || exit'
  fi
}

Run_Local_Server() {
  Npm_Install_Local_Server
  sudo docker-compose up local
}

Container_Shell() {

  local shell_name="bash"

  case "${RELEASE_ENV}" in
    "local" | "dev" )
      shell_name=zsh
      Npm_Install_Local_Server
    ;;
  esac

  sudo docker-compose run --rm --service-ports ${RELEASE_ENV} ${shell_name}
}

Run_Local_Test_Server() {
  RELEASE_ENV="test"
  Build_Release
  sudo docker-compose up test
}

SSH_Remote_Execute() {
  ssh \
    -p "${REMOTE_PORT}" \
    "${REMOTE_USER}"@"${REMOTE_ADDRESS}" "${1? Missing command to execute via SSH on the remote server...}"
}

SCP_Copy_From_Remote() {
  local from_file="${1? Missing the file to copy from the remote server...}"
  local to_file="${2? Missing where to save the file from the remote server...}"

  scp \
    -P "${REMOTE_PORT}" \
    "${REMOTE_USER}"@"${REMOTE_ADDRESS}":"${REMOTE_APP_DIR}/${from_file}" "${to_file}"
}

Copy_From_Remote() {
  Setup_Configuration

  local from_file="${1? Missing the file to copy from the remote server...}"
  local to_file="./${LOCAL_DEPLOY_DIR}/${RELEASE_ENV}/${2:-${from_file}}"

  SCP_Copy_From_Remote "${from_file}" "${to_file}"

  printf "\nFind the remote ${REMOTE_APP_DIR}/${1} file at ${to_file}\n\n"
}

Update_Local_Env_Deploy_From_Remote_Env() {
  Setup_Configuration

  local backup_file="./${LOCAL_DEPLOY_DIR}/${RELEASE_ENV}/${ENV_DEPLOY_FILE}-update-${DATETIME}"

  cp "${ENV_DEPLOY_FILE}" "${backup_file}"
  printf "\nFind the backup file at ${backup_file}\n\n"

  SCP_Copy_From_Remote ".env" "${ENV_DEPLOY_FILE}"

  printf "\nUpdated the file ${ENV_DEPLOY_FILE}\n\n"
}

SCP_Copy_To_Remote() {
  local from_file="${1? Missing the file to copy with SCP to the remote server...}"
  local to_file="${2:-${from_file}}"

  scp \
    -P "${REMOTE_PORT}" \
    "${from_file}" \
    "${REMOTE_USER}"@"${REMOTE_ADDRESS}":"${REMOTE_APP_DIR}/${to_file}"
}

Tail_Remote_Logs() {
  Setup_Configuration

  SSH_Remote_Execute "cd ${REMOTE_APP_DIR} && sudo docker-compose logs --follow ${RELEASE_ENV}"
}

Boot_Remote_Server() {
  RELEASE_ENV="${1:-}"

  case "${RELEASE_ENV}" in
    "local" )
      Run_Local_Server
    ;;

    "test" )
      Run_Local_Test_Server
    ;;

    "dev" | "staging" | "rc" )
      Setup_Configuration
      SSH_Remote_Execute "cd ${REMOTE_APP_DIR} && sudo docker-compose up --detach ${RELEASE_ENV}"
    ;;

    "" )
      Exit_With_Error "Please provide the environment to use, e.g ./astropiks up dev or ./astropiks up staging"
    ;;

    * )
      Exit_With_Error "You can only boot the Server for dev, staging or rc environments."
  esac
}

Shutdown_Remote_Server() {
  local shutdown_env="${1:-}"

  case "${shutdown_env}" in
    "local" )
      sudo docker-compose down
    ;;

    "dev" | "staging" | "rc" )
      RELEASE_ENV=${shutdown_env}
      Setup_Configuration
      SSH_Remote_Execute "cd ${REMOTE_APP_DIR} && sudo docker-compose down"
    ;;

    "" )
      Exit_With_Error "Please provide the environment to use, e.g ./astropiks down dev or ./astropiks down staging"
    ;;

    * )
      Exit_With_Error "You can only shutdown the Server for dev, staging or rc environments."
  esac
}

Rsync_To_Remote() {
  Setup_Configuration

  # SSH_Remote_Docker_Load
  rsync -azP .git "${REMOTE_USER}"@"${REMOTE_ADDRESS}":"${REMOTE_APP_DIR}"
  rsync -azP \
    --delete-after \
    --exclude .env \
    --exclude src/client \
    --exclude src/proxy/nodejs/dist \
    --exclude src/proxy/nodejs/node_modules \
    src "${REMOTE_USER}"@"${REMOTE_ADDRESS}":"${REMOTE_APP_DIR}"
}

Build_Release() {
  local env="${1:-$RELEASE_ENV}"

  sudo docker-compose build \
    --no-cache \
    --build-arg "BUILD_RELEASE_FROM=${BUILD_RELEASE_FROM}" \
    "${env}"
}

Deploy_Release() {
  Setup_Configuration

  echo "\n\n------------------ DEPLOYING TO: ${REMOTE_APP_DIR} ------------------\n\n"

  SSH_Remote_Execute "mkdir -p ${REMOTE_APP_DIR}"

  local env_deploy_backup_file=".env.remote-backup-${DATETIME}"

  case "${ENV_FILE_TO_USE}" in
    "remote" )
      # Keep a local backup copy from the remote .env file just in case we
      # screw-up it with the deployment.
      Copy_From_Remote ".env" "${env_deploy_backup_file}" || true
      Copy_From_Remote "${ENV_DEPLOY_FILE}" "${ENV_DEPLOY_FILE}-remote-backup-${DATETIME}" || true
    ;;
  esac

  # The domains used for Traefik to serve the backend server need to be added
  # because they are dynamically set at the Setup_Configuration().
  if grep -q "^PUBLIC_DOMAINS=" "${ENV_DEPLOY_FILE}"; then
    sed -i -e "s|^PUBLIC_DOMAINS=.*|PUBLIC_DOMAINS=${DOMAINS}|" "${ENV_DEPLOY_FILE}"
  else
    echo "PUBLIC_DOMAINS=${DOMAINS}" >> "${ENV_DEPLOY_FILE}"
  fi

  if grep -q "^DOCKER_IMAGE=" "${ENV_DEPLOY_FILE}"; then
    sed -i -e "s|^DOCKER_IMAGE=.*|DOCKER_IMAGE=${REMOTE_DOCKER_IMAGE}|" "${ENV_DEPLOY_FILE}"
  else
    echo "DOCKER_IMAGE=${REMOTE_DOCKER_IMAGE}" >> "${ENV_DEPLOY_FILE}"
  fi

  if grep -q "^RELEASE_TAG=" "${ENV_DEPLOY_FILE}"; then
    sed -i -e "s|^RELEASE_TAG=.*|RELEASE_TAG=${RELEASE_TAG}|" "${ENV_DEPLOY_FILE}"
  else
    echo "RELEASE_TAG=${RELEASE_TAG}" >> "${ENV_DEPLOY_FILE}"
  fi

  if grep -q "^BUILD_RELEASE_FROM=" "${ENV_DEPLOY_FILE}"; then
    sed -i -e "s|^BUILD_RELEASE_FROM=.*|BUILD_RELEASE_FROM=${BUILD_RELEASE_FROM}|" "${ENV_DEPLOY_FILE}"
  else
    echo "BUILD_RELEASE_FROM=${BUILD_RELEASE_FROM}" >> "${ENV_DEPLOY_FILE}"
  fi

  SCP_Copy_To_Remote "${ENV_DEPLOY_FILE}"
  SCP_Copy_To_Remote ".env"
  SSH_Remote_Execute "cd ${REMOTE_APP_DIR} && cat .env.deploy >> .env"

  SCP_Copy_To_Remote "docker-compose.yml"
  SCP_Copy_To_Remote "Dockerfile"
  SCP_Copy_To_Remote "prod.Dockerfile"

  Rsync_To_Remote

  SSH_Remote_Execute "cd ${REMOTE_APP_DIR} && sudo docker-compose build --no-cache ${RELEASE_ENV}"

  case "${RELEASE_ENV}" in
    "dev" )
      # rsync -azP --exclude src/client src "${REMOTE_USER}"@"${REMOTE_ADDRESS}":"${REMOTE_APP_DIR}"
      SSH_Remote_Execute "cd ${REMOTE_APP_DIR} && sudo docker-compose up npm-install"
    ;;
  esac

  SSH_Remote_Execute "cd ${REMOTE_APP_DIR} && sudo docker-compose up --detach ${RELEASE_ENV}"

  SSH_Remote_Execute "cd ${REMOTE_APP_DIR} && sudo docker-compose logs --tail 100"

  case "${ENV_FILE_TO_USE}" in
    "remote" )
      printf "\nFind the backup for the .env file at: ${env_deploy_backup_file}\n\n"
    ;;
  esac

  printf "\n\n---> Server now available at: ${DOMAINS}\n\n"
}

Main() {

  local DATETIME=$(date +%s)

  local SETUP_CONFIG_DONE="false"

  local BUILD_CONTEXT="${PWD}"

  local APP_NAME=astropiks

  local REMOTE_PORT=22
  local REMOTE_ADDRESS=demo.approov.io

  local RELEASE_ENV=local

  local ENV_DEPLOY_FILE=.env.deploy

  # With a value of 1: dev1.demo.approov.io, staging1.demo.approov.io, rc1.demo.approov.io,
  local RELEASE_TAG=""

  local SERVER_PUBLIC_DOMAIN=demo.approov.io
  # local BASE_PUBLIC_DOMAIN=demo.approov.io
  local BUILD_RELEASE_FROM=master
  local LOCAL_DEPLOY_DIR=.local/deploy
  local ENV_FILE_TO_USE=remote

  local ENV_ERROR="Env var not set or empty. See DEPLOYMENT.md."

  # To be used to copy env files from the remote server and for backups when deploying
  mkdir -p "${LOCAL_DEPLOY_DIR}"/dev "${LOCAL_DEPLOY_DIR}"/staging "${LOCAL_DEPLOY_DIR}"/prod

  for input in "${@}"; do
    case "${input}" in

      --build-context )
        BUILD_CONTEXT="${PWD}/${2? Missing BUILD_CONTEXT}"
        shift 2
      ;;

      --env )
        RELEASE_ENV="${2? Missing release env, e.g dev, staging, or prod}"
        shift 2
      ;;

      --env-type )
        ENV_FILE_TO_USE="${2? Missing env locatiotaion ot use, e.g local or remote}"
        shift 2
      ;;

      --from )
        BUILD_RELEASE_FROM="${2? Missing branch or tag to deploy from, e.g master or 1.0.0}"
        shift 2
      ;;

      --from-current )
        shift 1
        BUILD_RELEASE_FROM=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD)
      ;;

      --release-tag )
        RELEASE_TAG="${2? Missing RELEASE_TAG, e.g. 1, 2, 3 etc.}"
        shift 2
      ;;

      -h | --help )
        Show_Help
        exit $?
      ;;

      build )
        shift 1
        Build_Release "${1}"
        exit $?
      ;;

      copy-env )
        shift 1
        Copy_From_Remote ".env"
        exit $?
      ;;

      update-env )
        Update_Local_Env_Deploy_From_Remote_Env
        exit $?
      ;;

      deploy )
        Deploy_Release
        exit $?
      ;;

      logs )
        Tail_Remote_Logs
        exit $?
      ;;

      down )
        shift 1
        Shutdown_Remote_Server "${1}"
        exit $?
      ;;

      up )
        shift 1
        Boot_Remote_Server "${1}"
        exit $?
      ;;

      run )
        shift 1
        Run_Local_Server
        exit $?
      ;;

      rsync )
        Rsync_To_Remote
        exit $?
      ;;

      shell )
        shift 1
        Container_Shell
        exit $?
      ;;

    esac
  done

  Show_Help
}

Main "${@}"
