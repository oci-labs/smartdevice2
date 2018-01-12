// @flow

// Before running this,
// 1) start Mosquitto broker (or verify that it is running)
// 2) optionally enter "java -jar TheJoveExpress.jar"
//    to get lots of messages

/*
Expected Messages:
thejoveexpress/lifecycle/feedback - boolean, 1 byte
thejoveexpress/engine/power/feedback - rational
thejoveexpress/engine/calibration/feedback - rational
thejoveexpress/lights/ambient/feedback - rational
thejoveexpress/lights/override/feedback - enum, 4 bytes 0=off, 1=on, 2=auto
thejoveexpress/lights/power/feedback - boolean, 1 byte
thejoveexpress/lights/calibration/feedback - rational
*/

const mqtt = require('mqtt');
const {getChildId, getParentId, updateProperty} = require('./instance-service');

const MSG_DELIM = '/';
const TRAIN_NAME = 'thejoveexpress';
//const MQTT_HOST = TRAIN_NAME + '.local';
const MQTT_HOST = 'localhost';
const MQTT_PORT = 1883;

//const feedbackTopic = getTopic('');

// To get a zero, kill train app.
// To get a one, restart train app.
const lifecycleTopic = getTopic('lifecycle');

const lightsOverrideTopic = getTopic('lights', 'override');
const lightsPowerTopic = getTopic('lights', 'power');
const enginePowerTopic = getTopic('engine', 'power');
const engineCalibrationTopic = getTopic('engine', 'calibration');
const lightsAmbientTopic = getTopic('lights', 'ambient');
const lightsCalibrationTopic = getTopic('lights', 'calibration');

function getTopic(...parts) {
  const middle = parts.length ? parts.join(MSG_DELIM) + MSG_DELIM : '';
  return TRAIN_NAME + MSG_DELIM + middle + 'feedback';
}

async function saveProperty(parentName, childName, property, value) {
  const instanceId = childName
    ? await getChildId(parentName, childName)
    : await getParentId(parentName);
  if (instanceId === 0) {
    throw new Error(
      'no instance found for ' + parentName + MSG_DELIM + childName
    );
  }

  await updateProperty(instanceId, property, value);
}

// message is a Buffer
function handleMessage(topic, message) {
  //console.log('message length =', message.length);
  const parts = topic.split('/');
  parts.pop(); // removes "feedback" or "control" from end
  const [parentName] = parts;
  const hasChild = parts.length === 3;
  const childName = hasChild ? parts[1] : undefined;
  const property = hasChild ? parts[2] : parts[1];

  let value;
  switch (topic) {
    case lifecycleTopic:
    case lightsPowerTopic:
      value = message.readInt8(0);
      break;

    case lightsOverrideTopic:
      value = message.readInt32BE(0);
      break;

    case enginePowerTopic:
    case engineCalibrationTopic:
    case lightsAmbientTopic:
    case lightsCalibrationTopic:
      value = message.readIntBE(0, 8);
      //const maxValue = message.readIntBE(8, 8);
      //console.log('maxValue =', maxValue);
      break;
  }

  if (value !== undefined) {
    console.log(topic, '=', value);
    saveProperty(parentName, childName, property, value);
  } else {
    console.error('unsupported topic', topic);
  }
}

function mqttService() {
  const client = mqtt.connect('mqtt://' + MQTT_HOST + ':' + MQTT_PORT);
  // Listen for messages on all topics.
  client.on('connect', () => client.subscribe('#'));
  client.on('message', handleMessage);
}

module.exports = {
  mqttService
};
