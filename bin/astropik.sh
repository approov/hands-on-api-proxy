#!/bin/sh

set -eu

Show_Help() {
    printf "TODO"
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

Proxy_Down() {
    local _proxy_name="${1:? Missing proxy step name, like: 1_open-proxy}"
    ${DOCKER_COMPOSE} rm -s "${_proxy_name}"
}

Docker_Logs() {
    ${DOCKER_COMPOSE} logs ${@}
}


Main() {
    local ROOT_PREFIX=""
    local DOCKER_COMPOSE=$(which docker-compose)
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
                shift 1
                Docker_Logs ${@}
                exit $?
            ;;

            restart )

                exit $?
            ;;

            up )
                shift 1
                Proxy_Up ${@}
                exit $?
            ;;
        esac
    done

    Show_Help

    exit $?

}

Main ${@}
