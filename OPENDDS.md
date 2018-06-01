# OpenDDS Setup Instructions

These instructions assume that you wish to demonstrate both a secure and insecure
OpenDDS subscriber, as well as a secure and insecure publisher.

## Prerequisites

### Setup OpenDDS (security branch)

MacOS:

```
git clone -b security https://github.com/objectcomputing/OpenDDS.git
cd OpenDDS
brew install xerces-c
brew install openssl
./configure --xerces=/usr/local --ssl=/usr/local/opt/openssl --macros=CCFLAGS+=-std=c++11
source ./setenv.sh
make -sj4 OpenDDS_Security OpenDDS_Rtps_Udp Svc_Utils OpenDDS_InfoRepoDiscovery
cd ..
```

### Setup the Node.js bindings for OpenDDS (security branch)

MacOS (with Xcode installed):

```
git clone -b security https://github.com/oci-labs/node-opendds.git
cd node-opendds
brew install v8
export V8_ROOT=/usr/local
export NAN_ROOT=`pwd`/node_modules/nan
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
npm install -g node-gyp
node-gyp configure build
cd ..
```

### Build Publisher and Shared Libraries

MacOS:

```
cd server
npm install
npm link ../node-opendds/
cd ..
mwc.pl -type gnuace OpenddsDemo.mwc
make
```
