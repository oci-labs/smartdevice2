#MQTT

This project is using the "Mosquitto" MQTT server implementation. MQTT supports publish and subscribe operations.

## Setup Mosquitto

MacOS:

```
brew install mosquitto
```

### Start the Mosquitto Server (first time)

```
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.mosquitto.plist
```

This starts a process using /usr/local/opt/mosquitto/sbin/mosquitto

### Start Mosquitto on Startup (optional)

```
ln -sfv /usr/local/opt/mosquitto/*.plist ~/Library/LaunchAgents
```

### Stopping or Restarting the server

```
launchctl stop homebrew.mxcl.mosquitto
```

```
launchctl start homebrew.mxcl.mosquitto
```

## Mosquitto Commands

### Subscribe to Topic

```
mosquitto_sub -t topic/state
```

No quotes are needed around the -t value

### Publish a Message on a Topic

```
mosquitto_pub -t topic/state -m "Hello World"
```

No quotes are needed around the -t value

## Using MQTT from Node.js or browser JavaScript

### Install the "mqtt" Library

```
npm install mqtt
```

### Example Code

```ecmascript 6
const mqtt = require('mqtt');

const host = 'localhost';
const port = 1883;
const client = mqtt.connect('mqtt://' + host + ':' + port);
const topic = 'foo/bar';

client.on('connect', () => {
  client.subscribe(topic);
  client.publish(topic, 'Hello from MQTT!');
});

client.on('message', (topic, message) => {
  console.log(message.toString()); // message is a Buffer
  client.end(); // don't call to continue listening
});
```
