FROM node:alpine

WORKDIR /usr/src/app

# Install things needed to build some npm packages.
RUN apk update && \
    apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++ \
    mysql-client && apk del build-dependencies

COPY .babelrc .eslintrc.json .prettierrc server/config.json server/package.json server/package-lock.json server/.flowconfig ./
COPY database/ddl.sql ./database/ddl.sql
COPY server/public ./public
COPY server/src ./src

RUN npm install && npm run build

EXPOSE 3001

CMD ["npm", "start"]
