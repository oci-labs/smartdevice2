#!/bin/bash
set -e

export ACE_ROOT=/usr/src/app/OpenDDS/ACE_wrappers
export PATH=${PATH}:/usr/src/app/OpenDDS/ACE_wrappers/bin:/usr/src/app/OpenDDS/bin:/usr/local/gcloud/google-cloud-sdk/bin
export DDS_ROOT=/usr/src/app/OpenDDS
export CIAO_ROOT=unused
export MPC_ROOT=/usr/src/app/OpenDDS/ACE_wrappers/MPC
export XERCESCROOT=/usr
export TAO_ROOT=/usr/src/app/OpenDDS/ACE_wrappers/TAO
export SSL_ROOT=/usr
export DANCE_ROOT=unused
export LD_LIBRARY_PATH=${LD_LIBRARY_PATH}:/usr/src/app/OpenDDS/ACE_wrappers/lib:/usr/src/app/OpenDDS/lib:/usr/bin:/usr/bin
export CMAKE_ROOT=/usr
export V8_ROOT=~/.nvm/versions/node/v8.12.0
export NAN_ROOT=/usr/src/app/node-opendds/node_modules/nan

if [ "$1" = 'secure_smartdevice' ]; then
	npm run start-secure
else
	npm run start
fi

exec "$@"
