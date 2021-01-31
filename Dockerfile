FROM node:alpine
RUN apk add yarn
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node . .
USER node
RUN cd /home/node/app/api && \
    yarn install && \
    cd /home/node/app/client && \
    yarn install && \
    yarn build
EXPOSE 5000
ENV IP 0.0.0.0
ENV STATIC_PAGE_PATH /home/node/app/client/dist
CMD [ "node", "api/index.js" ]
