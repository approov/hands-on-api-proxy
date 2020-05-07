#!/bin/sh

set -eu

Show_Help() {
    cat << EOF

USAGE:

./astropik [options] <command> [arguments]


OPTIONS:

-it                     Enables interactive mode. Defaults is to tun on background.
                        $ ./astropik -it up 1_open-proxy


COMMANDS:

build                   Builds the Docker image for NodeJS.
                        $ ./astropik build

down <proxy-name>       Brings the given proxy dwon.
                        $ ./astropik down 1_open-proxy

logs <proxy-name>       Shows the logs for the given proxy.
                        $ ./astropik logs 1_open-proxy

restart <proxy-name>    Restarts the given proxy.
                        $ ./astropik restart 1_proxy_name

shell                   Starts an "sh" shell in the NodeJS docker container.
                        $ ./astropik shell

up <proxy-name>         Bings the given proxy up.
                        $ ./astropik up 1_open-proxy

EOF
}

Build_Docker_Image() {
    ${DOCKER_COMPOSE} build
}

Proxy_Up() {
    local _proxy_name="${1:? Missing proxy step name, like: 1_open-proxy}"

    if [ ! -d "./steps/proxy/node/${_proxy_name}/node_modules" ]; then
        ${DOCKER_COMPOSE} run "${_proxy_name}" sh -c 'npm install && exit || exit'
    fi

    ${DOCKER_COMPOSE} up ${BACKGROUND_MODE}  "${_proxy_name}"
}

Proxy_Restart() {
    local _proxy_name="${1:? Missing proxy step name, like: 1_open-proxy}"
    ${DOCKER_COMPOSE} restart "${_proxy_name}"
}

Proxy_Down() {
    local _proxy_name="${1:? Missing proxy step name, like: 1_open-proxy}"
    ${DOCKER_COMPOSE} rm -sf "${_proxy_name}"
}

Proxy_Shell() {
    ${DOCKER_COMPOSE} run --rm shell
}

Docker_Logs() {
    ${DOCKER_COMPOSE} ${@}
}


Main() {
    local ROOT_PREFIX=""
    local DOCKER_COMPOSE=$(which docker-compose)
    local BACKGROUND_MODE=--detach

    if [ ! -f ./.env ]; then
        printf "\nFATAL ERROR: Missing .env file. Copy .env.example to .env.\n"
        printf "\n---> Adjust values as needed, like the NASA_API_KEY.\n\n"
        exit 1
    fi

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

    local DOCKER_COMPOSE="${ROOT_PREFIX} ${DOCKER_COMPOSE}"

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

            build )
                Build_Docker_Image
                exit $?
            ;;

            down )
                shift 1
                Proxy_Down ${@}
                exit $?
            ;;

            logs )
                Docker_Logs ${@}
                exit $?
            ;;

            restart )
                shift 1
                Proxy_Restart ${@}
                exit $?
            ;;

            shell )
                shift 1
                Proxy_Shell ${@}
                exit $?
            ;;

            up )
                shift 1
                Proxy_Up ${@}
                exit $?
            ;;

            * )
                ${DOCKER_COMPOSE} ${@}
                exit $?
        esac
    done

    Show_Help

    exit $?

}

Main ${@}
