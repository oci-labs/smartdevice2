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
  sudo apt-get install mysql-client
  This installs the server and client.

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
* ssh pi@trainstation.local
* cd Mark/smartdevice2

* git pull (to get latest version of code)

* cd client
* npm install
* npm run deploy
  - copies client code to server/public

* cd ../server
* npm install
* npm run dbsetup-pi
* npm run build
* npm start
* from another machine on the same WiFi,
  browse http://trainstation.local:3001
  (may need to use IP address of the Pi
   which can be obtained by running ifconfig
   and noting the wlan0...inet value)

* to interactively examime the database on Pi
  - enter "npm run dbi-pi"
  - enter "use smartdevice"
  - enter any SQL queries

* fix for "Error: ER_NOT_SUPPORTED_AUTH_MODE: Client does not
  support authentication protocol requested by server"
  - enter "npm run dbi-pi"
  - enter "use mysql"
  - enter "update user set authentication_string=password(''), plugin='mysql_native_password' where user='root';"
  - enter "flush privileges"
  - enter "exit"
  - start server again

## Running with Docker

* MySQL
  - build Docker image for MySQL
    * docker build -f DockerfileDb -t oci/devodb .
      - image name is oci/devodb
  - verify that the image was created
    * docker images | grep devodb
  - run image inside a new Docker container
    * docker run --name devodb -e MYSQL_ROOT_PASSWORD={password} -e MYSQL_DATABASE=smartdevice -p 3306:3306 -d oci/devodb
      - container name is devodb
      - outputs the container id
      - creates the "smartdevice" database
      - initializes database using ddl.sql
        which is copied into the image in DockerFileDb
  - verify that the container is running
    * docker ps | grep devodb
  - interactively examine the database
    * docker exec -it devodb mysql -uroot -p{password}
    * show databases;
    * use smartdevice
    * show tables;
    * describe {table-name};
    * exit
  - view logs
    * docker logs devodb
  - to stop the container, enter "docker stop devodb"
  - to remove the container, enter "docker rm devodb"
  - to remove the image, enter "docker rmi -f oci/devodb"

* Client (web UI)
  - deploy client code to server
    * cd to client directory
    * npm run deploy
      - creates optimized production build
      - copies to server/public directory

* REST/Web Server
  - build Docker image
    * cd to top project directory
    * docker build -t oci/devo .
  - run image inside a new Docker container
    * docker run -p3001:3001 -d oci/devo
    * outputs the container id
  - run the web app
    * browse http://localhost:3001
  - get the container id
    * docker ps | grep oci/devo
  - view logs
    * docker logs {container-id}
