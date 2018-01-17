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

const isEqual = require('lodash/isEqual');
const mqtt = require('mqtt');
const WebSocket = require('ws');

const {
  PATH_DELIMITER,
  getInstanceId,
  updateProperty
} = require('./instance-service');

import type {PrimitiveType} from './types';

const MSG_DELIM = '/';
const TRAIN_NAME = 'thejoveexpress';
//const MQTT_HOST = TRAIN_NAME + '.local';
const MQTT_HOST = 'localhost';
const MQTT_PORT = 1883;
const SPECIAL_SUFFIXES = ['control', 'feedback'];

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

let lastChange, ws;

function websocketSetup() {
  const wsServer = new WebSocket.Server({port: 1337});
  console.info('waiting for WebSocket connection');
  wsServer.on('connection', webSocket => {
    console.info('got WebSocket connection');
    ws = webSocket;

    ws.on('error', error => {
      if (error.code !== 'ECONNRESET') {
        console.error('websocket error:', error.code);
      }
    });
  });
}

websocketSetup();

function getTopic(...parts) {
  const middle = parts.length ? parts.join(MSG_DELIM) + MSG_DELIM : '';
  return TRAIN_NAME + MSG_DELIM + middle + 'feedback';
}

async function saveProperty(
  path: string,
  property: string,
  value: PrimitiveType
): Promise<void> {
  const instanceId = await getInstanceId(path);
  if (instanceId === 0) {
    console.error('no instance found for ' + path);
    return;
  }

  const alertsChanged = await updateProperty(instanceId, property, value);

  if (ws) {
    // Notify web client about property change.
    const change = {instanceId, property, value};
    if (!isEqual(change, lastChange)) {
      lastChange = change;
      ws.send(JSON.stringify(change));
    }

    // Notify web client that new alerts may be available.
    if (alertsChanged) ws.send('reload alerts');
  }
}

// message is a Buffer
function handleMessage(topic, message) {
  //console.log('message length =', message.length);
  const parts = topic.split('/');

  const lastPart = parts[parts.length - 1];
  if (SPECIAL_SUFFIXES.includes(lastPart)) parts.pop();

  const property = parts.pop();

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
    case lightsCalibrationTopic: {
      const rawValue = message.readIntBE(0, 8);
      const maxValue = message.readIntBE(8, 8);
      value = 100 * (rawValue / maxValue);
      break;
    }
  }

  if (value !== undefined) {
    //console.log(topic, '=', value);
    const path = parts.join(PATH_DELIMITER);
    saveProperty(path, property, value);
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
