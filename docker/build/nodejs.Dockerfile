FROM node:alpine

RUN apk add \
        python3 \
        make \
        g++

USER node

RUN mkdir /home/node/workspace && \
    chown node:node /home/node/workspace

WORKDIR /home/node/workspace

CMD ["sh"]
