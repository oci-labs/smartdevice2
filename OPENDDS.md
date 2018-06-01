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

### Running the Publisher

Once you have the application running and all of your definitions imported,
the following command will send "bogus" data from an insecure OpenDDS publisher:

```
bin/NexmatixMockPublisher -b -DCPSConfigFile rtps_disc.ini
```

In order to publish valid data from a secure OpenDDS publisher, run the following:

```
bin/NexmatixMockPublisher -DCPSConfigFile rtps_disc_secure.ini
```

Note: These commands can only be run a "prepared" OpenDDS terminal.
See the previous section [Resetting Your OpenDDS Environment](#resetting-your-opendds-environment).
