// @flow

// Before running this,
// 1) start Mosquitto broker (or verify that it is running)
// 2) optionally enter "java -jar TheJoveExpress.jar"
//    to get lots of messages

const TRAIN_NAME = 'thejoveexpress';

//const mqttHost = TRAIN_NAME + '.local';
const mqttHost = 'localhost';

const mqtt = require('mqtt');
const PORT = 1883;
const client = mqtt.connect('mqtt://' + mqttHost + ':' + PORT);

const topicPrefix = TRAIN_NAME + '/';

function getTopic(name) {
  return topicPrefix + (name ? name + '/' : '') + 'feedback';
}

const feedbackTopic = getTopic('');

// To get a zero, kill train app.
// To get a one, restart train app.
const lifecycleTopic = getTopic('lifecycle');

const lightsOverrideTopic = getTopic('lights/override');
const lightsPowerTopic = getTopic('lights/power');
/*
const enginePowerTopic = getTopic('engine/power');
const engineCalibrationTopic = getTopic('engine/calibration');
const lightsAmbientTopic = getTopic('lights/ambient');
const lightsCalibrationTopic = getTopic('lights/calibration');
*/

client.on('connect', () => {
  const topic = TRAIN_NAME + '/#';
  client.subscribe(topic);
  //client.publish(topic, 'Hello from MQTT!');
  client.publish('thejoveexpress/feedback');
});

// message is a Buffer
client.on('message', (topic, message) => {
  console.log('got message for topic', topic);
  console.log('message length =', message.length);

  switch (topic) {
    case feedbackTopic:
      break;

    case lifecycleTopic:
    case lightsPowerTopic: {
      const value = message.readInt8(0);
      console.log('lifecycle =', value);
      break;
    }

    case lightsOverrideTopic: {
      const value = message.readInt32BE(0);
      console.log('lights override =', value);
      break;
    }

    default: {
      const num = message.readIntBE(0, 8);
      console.log('num =', num);
      const den = message.readIntBE(8, 8);
      console.log('den =', den);
      break;
    }
  }

  //client.end();
});

/*
thejoveexpress/lifecycle/feedback - boolean, 1 byte
thejoveexpress/engine/power/feedback - rational
thejoveexpress/engine/calibration/feedback - rational
thejoveexpress/lights/ambient/feedback - rational
thejoveexpress/lights/override/feedback - enum, 4 bytes 0=off, 1=on, 2=auto
thejoveexpress/lights/power/feedback - boolean, 1 byte
thejoveexpress/lights/calibration/feedback - rational
*/
