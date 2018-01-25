# smartdevice2

This version of the SmartDevice web app provides flexibility
in defining the organizational hierarchy and
types of supported devices.

## Installs

* Install Node.js

  This can be done by downloadind and running an installer
  from https://nodejs.org.
  On a Mac with Homebrew installed,
  this can be done by running `brew install node`.
  On a RaspberryPi,
sudo apt-get install git && git clone https://github.com/audstanley/NodeJs-Raspberry-Pi-Arm7 && cd NodeJs-Raspberry-Pi-Arm7 && chmod +x Install-Node.sh && sudo ./Install-Node.sh;

* Install MySQL

  Follow the instructions at https://dev.mysql.com/downloads/mysql/.
  On a Mac with Homebrew installed,
  this can be done by running `brew install mysql`.
  On a RaspberryPi,
  sudo apt-get install mysql-server

## MQTT Setup

See MosquittoNotes.txt in the top directory for Mac
On a RaspberryPi,
sudo apt-get install mosquitto

## Server Setup
* open a terminal window
* `cd server`
* `npm install` (initially and for each new version)
* `npm run dbstart` (only if MySQL server isn't running)
* `npm run dbsetup` (initially and only after schema changes)
  WARNING: This will delete all data in the database.
* `npm run build` (initially and for each new version)
* `npm run start`

## Client Setup
* open a terminal window
* `cd client`
* `npm install` (initially and for each new version)
* `npm run start`
* a new tab will open in the default web browser
* add types in the hierarchy
* define properties to each type
* define alerts for each type
* create instances of each type

## Simulator Setup
* open a terminal window
* `java -jar TheJoveExpress.jar`

## Building on Raspberry Pi
* cd Train/Device
* cd client
* npm install
* npm run deploy
* cd ../server
* npm install
* npm run build
* npm start
* from another machine on the same WiFi,
  browse http://trainstation.local:3001
