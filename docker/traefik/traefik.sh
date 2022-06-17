#!/bin/sh

set -eu

Show_Help() {
    printf "
TRAEFIK PROXY FOR DOCKER CONTAINERS

USAGE:

./traefik [options] <command> [arguments]


OPTIONS:

-it         Runs Traefik attached to the the TTY.
            $ ./traefik -it up


COMMANDS:

down        Stops and removes the docker container for Traefik.
            $ ./traefik down

logs        Shows the logs for the Traefik Docker container.
            $ ./traefik logs
            $ ./traefik logs -f
            $ ./traefik logs -f --tail 50

restart     Restarts the Docker container for Traefik.
            $ ./traefik restart

up          Creates and starts the Docker container for Traefik.
            $ ./traefik up
            $ ./traefik -it up

"
}

Start_Traefik() {

    # Traefik will not create the certificates if we don't fix the permissions
    #  for the file where it stores the LetsEncrypt certificates.
    chmod 600 ./docker/traefik/acme.json

    # IMPORTAN:
    #
    # The Traefik domain and the Acme email need to be adjusted for some you own.
    if [ ! -f ./docker/traefik/.env ]; then
        cp ./docker/traefik/.env.example ./docker/traefik/.env
        printf "\n---> Please edit ./docker/traefik/.env file, and adjust the following values: \n\n"
        cat ./docker/traefik/.env
        echo
        return 1
    fi

    # Creates a docker network that will be used by Traefik to proxy the requests to the docker containers:
    ${DOCKER} network create traefik 2> /dev/null || true

    Docker_Compose up "${BACKGROUND_MODE}" traefik

    printf "\n---> TRAEFIK is now listening on port 80 and 443 <---\n"

    if [ "${BACKGROUND_MODE}" = "--detach" ]; then
        printf "\n---> Tail the Traefik logs in real-time:\n"
        printf "./traefik logs -f --tail 50\n\n"
    fi

    echo
}

Docker_Compose() {

    # We need to be inside trefik folder, otherwise docker-compose will not read
    #  the correct `.env` file, because it always read the `.env` file from
    #  where is invoked.
    cd ./docker/traefik
    ${DOCKER_COMPOSE} ${@}
}

Main() {

    local BACKGROUND_MODE=--detach

    # Auto detect if we need to use sudo
    if type sudo 2>&1 1> /dev/null; then
        local ROOT_PREFIX=sudo
    fi

    # Sometimes we may have sudo in our system, but to run `docker-compose` it
    #  will not find the executable with sudo, I am looking at you AWS EC2, thus
    #  we can customize it.
    if [ -f ./.astropik.local.vars ]; then
        . ./.astropik.local.vars
    fi

    local DOCKER="${ROOT_PREFIX} docker"

    local DOCKER_COMPOSE="${ROOT_PREFIX} docker-compose"

    for input in  "${@}"; do
        case "${input}" in
            -h | --help | help )
                Show_Help
                exit $?
            ;;

            -it )
                shift 1
                local BACKGROUND_MODE=
            ;;

            up )
                shift 1
                Start_Traefik
                exit $?
            ;;

             * )
                Docker_Compose ${@}
                exit $?
        esac
    done

    Show_Help
}

Main ${@}
