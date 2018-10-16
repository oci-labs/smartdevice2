FROM node:8-stretch
WORKDIR /usr/src/app

# Install things needed to build some npm packages.
RUN apt-get update && \
    apt-get install --yes build-essential && apt-get install -y \
    python \
    make \
    gcc \
    g++ \
    mysql-client \
    libc-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy build files to Docker image
COPY server/node_modules/ ./node_modules/
COPY OpenDDS/ ./OpenDDS/
COPY node-opendds/ ./node-opendds/
COPY .babelrc deploy.sh server/config/config-prod.json server/config/config-secure-prod.json server/package.json ./
COPY server/build/ ./
COPY server/public/ ./public

EXPOSE 3001
RUN ["chmod", "+x", "/usr/src/app/deploy.sh"]
ENTRYPOINT ["/usr/src/app/deploy.sh"]

#CMD ["secure_smartdevice"]
# CMD sends parameter to ENTRYPOINT. Comment CMD to build devo docker image (unsecure)

