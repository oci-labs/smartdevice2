// @flow

const mqtt = require('mqtt');
//const host = 'test.mosquitto.org';
const host = 'localhost';
const port = 8883;
//const client = mqtt.connect('mqtt://test.mosquitto.org');
const client = mqtt.connect('mqtt://' + host + ':' + port);

const topic = 'foo/bar';

client.on('connect', () => {
  client.subscribe(topic);
  client.publish(topic, 'Hello from MQTT!');
});

client.on('message', (topic, message) => {
  // message is a Buffer
  console.log(message.toString());
  //client.end();
});
