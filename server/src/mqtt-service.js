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
const MySqlConnection = require('mysql-easier');
const WebSocket = require('ws');

const {
  PATH_DELIMITER,
  getInstanceId,
  updateProperty
} = require('./instance-service');

import type {NodeType, MessageServerType, PrimitiveType} from './types';

const MSG_DELIM = '/';
const TRAIN_NAME = 'thejoveexpress';
const SPECIAL_SUFFIXES = ['control', 'feedback'];

// To get a zero, kill train app.
// To get a one, restart train app.
const lifecycleTopic = getTopic('lifecycle');

const lightsOverrideTopic = getTopic('lights', 'override');
const lightsPowerTopic = getTopic('lights', 'power');
const enginePowerTopic = getTopic('engine', 'power');
const engineCalibrationTopic = getTopic('engine', 'calibration');
const lightsAmbientTopic = getTopic('lights', 'ambient');
const lightsCalibrationTopic = getTopic('lights', 'calibration');

let lastChange, mySql, ws;

function getInstances(type: NodeType) {
  const sql = 'select name from instance where typeId=?';
  return mySql.query(sql, type.id);
}

async function getMessageServer(type: NodeType) {
  const {messageServerId} = type;
  if (!messageServerId) return;

  const sql = 'select * from message_server where id=?';
  const rows = await mySql.query(sql, messageServerId);
  const [server] = rows;
  return server;
}

function getTopic(...parts) {
  const middle = parts.length ? parts.join(MSG_DELIM) + MSG_DELIM : '';
  return TRAIN_NAME + MSG_DELIM + middle + 'feedback';
}

function getTopLevelTypes() {
  const sql = 'select * from type where parentId = 1';
  return mySql.query(sql);
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
      const rawValue = message.readIntBE(0, 4);
      console.log('mqtt-service.js handleMessage: rawValue =', rawValue);
      const maxValue = message.readIntBE(4, 4);
      console.log('mqtt-service.js handleMessage: maxValue =', maxValue);
      value = 100 * (rawValue / maxValue);
      break;
    }
  }

  if (value !== undefined) {
    console.log(topic, '=', value);
    const path = parts.join(PATH_DELIMITER);
    saveProperty(path, property, value);
  } else {
    console.error('unsupported topic', topic);
  }
}

async function mqttService(connection: MySqlConnection) {
  mySql = connection;

  const serverMap = {};
  const topicsMap = {};

  const topLevelTypes = await getTopLevelTypes();

  for (const type of topLevelTypes) {
    // eslint-disable-next-line no-await-in-loop
    const server = await getMessageServer(type);
    if (server) {
      serverMap[server.id] = server;

      // eslint-disable-next-line no-await-in-loop
      const instances = await getInstances(type);
      const newTopics = instances.map(instance => instance.name + '/#');

      const topics = topicsMap[server.id] || [];
      topics.push(...newTopics);
      topicsMap[server.id] = topics;
    } else {
      console.error(
        `The type "${type.name}" has no associated message server!`
      );
    }
  }

  const servers = ((Object.values(serverMap): any): MessageServerType[]);
  servers.forEach(server => {
    const url = `mqtt://${server.host}:${server.port}`;
    const client = mqtt.connect(url);
    console.info('connected to', url);

    client.on('message', handleMessage);

    client.on('connect', () => {
      const topics = topicsMap[server.id];
      for (const topic of topics) {
        client.subscribe(topic);
        console.info('subscribed to MQTT topic', topic);
      }
    });
  });
}

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

module.exports = {
  mqttService
};
