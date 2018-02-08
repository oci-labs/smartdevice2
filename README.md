# smartdevice2

This version of the SmartDevice web app provides flexibility
in defining the organizational hierarchy and
types of supported devices.

## Installs

### Install Node.js

This can be done by downloadind and running an installer
from https://nodejs.org.
On a Mac with Homebrew installed,
this can be done by running `brew install node`.
On a RaspberryPi,
```
sudo apt-get install git && \
git clone https://github.com/audstanley/NodeJs-Raspberry-Pi-Arm7 && \
cd NodeJs-Raspberry-Pi-Arm7 && \
chmod +x Install-Node.sh && \
sudo ./Install-Node.sh
```

### Install MySQL

Follow the instructions at https://dev.mysql.com/downloads/mysql/.
On a Mac with Homebrew installed,
this can be done by running `brew install mysql`.
On a RaspberryPi,
```
sudo apt-get install mysql-server
sudo apt-get install mysql-client
```
This installs the server and client.

## MQTT Setup

See `MosquittoNotes.txt` in the top directory
for steps to start the MQTT server on a Mac.
On a RaspberryPi, `sudo apt-get install mosquitto`.

## Server Setup
* open a terminal window
* `cd server`
* `npm install` (initially and for each new version)
* `npm run dbstart` (only if MySQL server isn't running)
* `npm run dbsetup` (initially and only after schema changes)
  WARNING: This will delete all data in the database.
  It can be restored by importing a .json file.
* `npm run build` (initially and for each new version)
* `npm run start`

## Local Client Setup
* open a terminal window
* `cd client`
* `npm install` (initially and for each new version)
* `npm run start`
* a new tab will open in the default web browser
* add types in the hierarchy
* define properties to each type
* define alerts for each type
* create instances of each type

## Local Simulator Setup
* open a terminal window
* `java -jar TheJoveExpress.jar`

## Building on Raspberry Pi

* `ssh pi@trainstation.local`
* `cd Mark/smartdevice2`

* `git pull` (to get latest version of code)

* `cd client`
* `npm install`
* `npm run deploy`
  - copies client code to `server/public`

* `cd ../server`
* `npm install`
* `npm run dbsetup-pi`
* `npm run build`
* `npm start`
* from another machine on the same WiFi,
  browse http://trainstation.local:3001
  (may need to use IP address of the Pi
   which can be obtained by running ifconfig
   and noting the wlan0...inet value)

* to interactively examime the database on Pi
  - enter `npm run dbi-pi`
  - enter `use smartdevice`
  - enter any SQL queries

* fix for "Error: ER_NOT_SUPPORTED_AUTH_MODE: Client does not
  support authentication protocol requested by server"
  - enter `npm run dbi-pi`
  - enter `use mysql`
  - enter `update user set authentication_string=password(''), plugin='mysql_native_password' where user='root';`
  - enter `flush privileges`
  - enter `exit`
  - start server again

## Running with Docker

- images run in containers
- to build an image, use the `docker build` command
  * see examples below
  * the instructions for how to build an image
    are typically placed in a file named `Dockerfile`
- to run an existing image in a new container,
  use the `docker run` command
  * see examples below
- to verify that an image exists
  * `docker images | grep {image-name}`
- to verify that a container exists and get its id
  * `docker ps | grep {container-name}`
- to view logs of a container
  * `docker logs {container-name}`
- to get a shell in a container
  * `docker exec -it {container-name} bash`
    - if you get an error saying that `bash` isn't found,
      try `sh` instead
- to stop a container
  * `docker stop {container-name}`
- to remove a stopped container
  * `docker rm {container-name}`
- to remove an image
  * `docker rmi -f {image-name}`

### MySQL
- build Docker image for MySQL
  * cd database
  * `docker build -t oci/devodb .`
    - image name is oci/devodb
- run image inside a new Docker container
  * `docker run --name devodb \
    -e MYSQL_ROOT_PASSWORD={password} \
    -e MYSQL_DATABASE=smartdevice \
    -p 3306:3306 -d oci/devodb`
    - container name is devodb
    - outputs the container id
    - creates the "smartdevice" database
    - initializes database using ddl.sql
      which is copied into the image in DockerFileDb
- interactively examine the database
  * `docker exec -it devodb mysql -uroot [-p{password}]`
  * `show databases;`
  * `use smartdevice`
  * `show tables;`
  * `describe {table-name};`
  * `exit`

### Client (web UI)
- deploy client code to server
  * cd to client directory
  * `npm run deploy`
    - creates optimized production build
    - copies to `server/public` directory

### REST/Web Server
- build Docker image
  * cd to top project directory
  * `docker build -t oci/devo .`
    - image name is oci/devo
- run image inside a new Docker container
  * `docker run --name devo --link devodb:mysql -p3001:3001 -d oci/devo`
    - container name is devo
    - outputs the container id
    - to see the ip address and host name assigned to devodb,
      * `docker exec -it devo sh`
      * `cat /etc/hosts | grep mysql`
      * example output: `172.17.0.2 mysql b11f93a270a6 devodb`
        - first item is IP address
        - third item is host name
- run the web app
  * browse http://localhost:3001

### Docker Compose
- manages multiple Docker-based services
- described in a YAML file named `docker-compose.yml`
- to build an image for each service,
  `docker-compose build`
- to run these services in a container,
  `docker-compose up`
  * before running this, stop any locally running servers
    for this project
  * when this completes, browse http://localhost:3001
  * to stop all these containers, press ctrl-c
- to do the same but in the background,
  `docker-compose up -d`
  * to stop all these containers,
    `docker-compose stop`
    - what does `docker-compose down` do?
- to combine building and running in one command,
  `docker-compose up --build`
- creates a virtual network where the virtual host names match the service names

## Kubernetes

### Terminology

* Image - a Docker image
* Container - a Docker container
* Pod - Is this the Kubernetes equivalent of a Docker image?
* Replica Set - set of pod instances that can handle requests?
* Deployment - Is this the Kubernetes equivalent of a Docker container?
* Service - exposes a deployment on a port

### Google Cloud Platform (GCP) Setup
- these steps assumes Docker is installed
- to go to GCP Console
  * browse http://cloud.google.com
  * sign in to your OCI Google account
  * click "CONSOLE" in upper-right
  * select an existing project from dropdown near upper-left
- install "Google Cloud SDK"
  * follow steps at https://cloud.google.com/sdk/
  * if already installed, enter `gcloud components update`
    to get the latest version
- install kubectl
  * open a terminal window
  * `gcloud components install kubectl`
- set gcloud defaults
  * `export PROJECT_ID=ocismartdevice`
    - in Fish shell, `set -x PROJECT_ID ocismartdevice`
  * `gcloud config set project $PROJECT_ID`
  * `gcloud config set compute/zone us-central1-b`
- create a container cluster (one-time)
  * `gcloud container clusters create {cluster-name} --num-nodes=3`
    - I used "ocismartdevice" for the cluster name
    - takes a few minutes to complete
  * another way is to use the web console
    - from the Console hamburger menu select
      Kubernetes Engine ... Kubernetes clusters
    - press "Create cluster" button
    - enter a name (ex. ocismartdevice)
    - can accept all the other defaults
    - press "Create" button
    - takes a few minutes to complete

### Google Cloud Persistent Disk
- one use is to enable using MySQL in a way that
  data is not lost when the database service is restarted
- to allocate persistent disk space
  * `gcloud compute disks create --size 1GB smartdevice-disk`
  * 1GB is the smallest size that can be requested
- to delete a persistent disk space
  * `gcloud compute disks delete smartdevice-disk`
  * this must be done before one can be recreated

### Kubernetes Secrets
- to create a Kubernetes secret
  * `./create-secret {secret-name} {data-name} {data-value}`
  * these are typically referenced in a Kubernetes .yaml file
  * ex.
    ```
    env:
      - name: MYSQL_ROOT_PASSWORD
        valueFrom:
          secretKeyRef:
            name: mysql-root-auth
            key: root-password
    ```
- to delete a Kubernetes secret
  * `kubectl delete secret {secret-name}`
- to get a Kubernetes secret
  * `./get-secret {secret-name} {data-name}`
  * it may appear that the value ends with a newline, but it doesn't
- to get the names defined in a Kubernetes secret
  * `./get-secrets {secret-name}`

### Deploying to Google Cloud Platform (GCP)
- cd to top project directory
- to build a Docker image for the web/REST server
  and push it to the Google Cloud Container Registry
  * `./image`
  * this uses Dockerfile
- to start everything in GCP
  * `./gcpup`
  * this uses server.yaml and database/database.yaml
- to create/recreate the database in GCP
  * `./dbsetup`
- to interactively query the database in GCP
  * `./dbi`
  * `show tables;`
  * enter any SQL commands
- to see a list of things managed by Kubernetes
  * `kubectl get {kind}`
    where kind can be many values including
    all, services (or svc), deployments (or deploy),
    pods (or po), replicasets (or rc), or secrets
  * enter `kubectl get --help` to see more valid kinds
- to see even more detail
  * `kubectl describe {kind}`
- to view the logs of the database deployment
  * `./dblog`
- to view the logs of the web/REST server deployment
  * `./serverlog`
- to get a shell into a Kubernetes pod for poking around
  * `./kshell {pod-name}`
  * ex. ./kshell devo-database or ./kshell devo-server
- to open the web app running in Kubernetes
  * `./openapp`
- to stop everything in GCP
  * `./gcpdown`
- the web/REST server is ready to use when it has an EXTERNAL-IP
  * enter `kubectl get services` repeatedly until they do

### Miscellaneious Google Cloud Platform tips
- to see content of GCP Container Registry
  * browse https://cloud.google.com
  * make sure the correct account is selected
    from the account dropdown in upper-right
  * click "CONSOLE" in upper-right
  * select a project from the dropdown near upper-left
  * select "Container Registry" from hamburger menu
- to see list of running instances
  * `gcloud compute instances list`
