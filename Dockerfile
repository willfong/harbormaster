FROM node:lts AS builder
WORKDIR /src
COPY ui/package.json ui/yarn.lock /src/
RUN yarn install
COPY ui/ /src/
RUN yarn build

FROM node:alpine
WORKDIR /app
COPY package.json yarn.lock /app/
RUN yarn install
COPY . /app/
COPY --from=builder /src/dist /app/dist/
EXPOSE 5000
ENV STATIC_PAGE_PATH /app/dist
CMD [ "node", "index.js" ]
