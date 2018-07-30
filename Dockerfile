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
COPY .babelrc server/config.json server/config-secure.json server/package.json ./
COPY server/build/ ./
COPY client/public/ ./public/

# Set environment variables
ENV SSL_ROOT=/usr \
    CMAKE_ROOT=/usr \
    XERCESCROOT=/usr \
    DANCE_ROOT=unused \
    CIAO_ROOT=unused \
    DDS_ROOT=/usr/src/app/OpenDDS \
    V8_ROOT=~/.nvm/versions/node/v8.12.0 \
    ACE_ROOT=/usr/src/app/OpenDDS/ACE_wrappers \
    MPC_ROOT=/usr/src/app/OpenDDS/ACE_wrappers/MPC \
    TAO_ROOT=/usr/src/app/OpenDDS/ACE_wrappers/TAO \
    NAN_ROOT=/usr/src/app/node-opendds/node_modules/nan \
    PATH=${PATH}:/usr/src/app/OpenDDS/ACE_wrappers/bin:/usr/src/app/OpenDDS/bin \
    LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/usr/src/app/OpenDDS/ACE_wrappers/lib:/usr/src/app/OpenDDS/lib:/usr/bin:/usr/bin

EXPOSE 3001
CMD ["npm", "start"]
