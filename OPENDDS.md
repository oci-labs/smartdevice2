# OpenDDS Setup Instructions

These instructions assume that you wish to demonstrate both a secure and insecure
OpenDDS subscriber, as well as a secure and insecure publisher.

## Prerequisites

All command blocks assume that you are operating from the project root directory.

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

Ubuntu:

```
git clone -b security https://github.com/objectcomputing/OpenDDS.git
cd OpenDDS
sudo apt-get install libxerces-c-dev
wget https://www.openssl.org/source/openssl-1.1.0f.tar.gz
tar xzvf openssl-1.1.0f.tar.gz
cd openssl-1.1.0f
./config -W1,--enable-new-dtags, -rpath,'$(LIBPATH)'
make -s && sudo make install
cd ..
./configure --xerces3 --ssl=/usr --macros=CCFLAGS+=-std=c++11
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
npm install
node-gyp configure build
cd ..
```

Ubuntu:

```
git clone -b security https://github.com/oci-labs/node-opendds.git
cd node-opendds
sudo apt-get install libv8-dev
export V8_ROOT=~/.nvm/versions/node/$(node -v)
export NAN_ROOT=`pwd`/node_modules/nan
npm install -g node-gyp
npm install
node-gyp configure build
cd ..
```

### Build Publisher and Shared Libraries

MacOS or Linux:

```
cd server
npm install
npm link ../node-opendds/
cd ..
mwc.pl -type gnuace OpenddsDemo.mwc
make
```

### Resetting Your OpenDDS Environment

If you need a new terminal and have run all of the build steps, you can reset the
environment necessary to run the Publisher or Server with OpenDDS support by executing
the following commands again:

MacOS or Linux:

```
export V8_ROOT=/usr/local
export NAN_ROOT=`pwd`/node_modules/nan
source OpenDDS/setenv.sh
```
