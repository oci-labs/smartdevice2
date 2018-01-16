# smartdevice2

This version of the SmartDevice web app provides flexibility
in defining the organizational hierarchy and
types of supported devices.

## Installs

. Install Node.js

  This can be done by downloadind and running an installer
  from https://nodejs.org.
  On a Mac with Homebrew installed,
  this can be done by running `brew install node`.

. Install MySQL

  Follow the instructions at https://dev.mysql.com/downloads/mysql/.
  On a Mac with Homebrew installed,
  this can be done by running `brew install mysql`.

## Server Setup
. open a terminal window
. `cd server`
. `npm install` (initially and for each new version)
. `npm run dbstart`
. `npm run dbsetup`
. `npm run start-dev`

## Client Setup
. open a terminal window
. `cd client`
. `npm install` (initially and for each new version)
. `npm run start`
. a new tab will open in the default web browser
. add types in the hierarchy
. add properties to each type
. define alerts for each type
. create instances of each type

## Simulator Setup
. open a terminal window
. `java -jar TheJoveExpress.jar`

## Outstanding Issues
. Check for NaN% displayed in InstanceDetail.
. Clear new alert inputs at some point.
. Investigate issue with condition not matching property names.
. Add "MQTT Servers" tab to enter hosts.
  In the future we may need to specify
  port, clientId, cleanSession, keepAlive, and lastWill.
- In TypeDetails, allow selection of an MQTT server
  only for top-level instances.
