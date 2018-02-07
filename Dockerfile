FROM node:alpine

WORKDIR /usr/src/app

COPY .babelrc .eslintrc.json .prettierrc server/config.json server/package.json server/package-lock.json server/.flowconfig ./
COPY server/public ./public
COPY server/src ./src

# Install things needed to build some npm packages.
RUN apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++ \
    && npm install \
    && apk del build-dependencies

RUN npm install
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
