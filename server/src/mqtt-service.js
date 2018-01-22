// @flow

// Before running this,
// 1) start Mosquitto broker (or verify that it is running)
// 2) optionally enter "java -jar TheJoveExpress.jar"
//    to get lots of messages

const isEqual = require('lodash/isEqual');
const mqtt = require('mqtt');
const MySqlConnection = require('mysql-easier');
const WebSocket = require('ws');

const {logError} = require('./util/error-util');

const {
  PATH_DELIMITER,
  getInstanceId,
  updateProperty
} = require('./instance-service');

import type {NodeType, MessageServerType, PrimitiveType} from './types';

const ENUM_PREFIX = 'enum:';
const SPECIAL_SUFFIXES = ['control', 'feedback'];

const clientMap = {}; // keys are server ids
const serverMap = {}; // keys are server ids

let lastChange, mySql, ws;

function connect(server: MessageServerType, typeId: number = 0) {
  const {id} = server;
  serverMap[id] = server;

  const client = clientMap[id];
  if (client) {
    // already connected
    subscribe(id, typeId);
  } else {
    const url = `mqtt://${server.host}:${server.port}`;
    const options = {};
    const client = mqtt.connect(url, options);
    clientMap[id] = client;

    client.on('connect', () => {
      console.info('connected to MQTT server at', url);
      subscribe(id, typeId);
    });

    client.on('message', handleMessage.bind(null, client));

    client.on('close', () => {
      console.info('MQTT server connection was closed.');
    });
    client.on('error', err => {
      console.error('MQTT server error:', err);
    });
    client.on('offline', () => {
      console.info('MQTT server is offline.');
    });
    client.on('reconnect', () => {
      console.info('MQTT server reconnect started.');
    });
  }
}

function disconnect(server: MessageServerType) {
  const url = `mqtt://${server.host}:${server.port}`;
  const client = mqtt.connect(url);
  if (client) {
    delete clientMap[server.id];
    client.end();
    console.info('disconnected from', url);
  }
}

function getAllTopLevelTypes() {
  const sql =
    'select t1.id, t1.name, t1.messageServerId ' +
    'from type t1, type t2 ' +
    'where t1.parentId = t2.id and t2.name = "root"';
  return mySql.query(sql);
}

function getInstances(typeId: number) {
  const sql = 'select name from instance where typeId=?';
  return mySql.query(sql, typeId);
}

async function getMessageServer(type: NodeType) {
  const {messageServerId} = type;
  if (!messageServerId) return;

  try {
    const sql = 'select * from message_server where id=?';
    const [server] = await mySql.query(sql, messageServerId);
    return server;
  } catch (e) {
    logError(e.message);
  }
}

async function getServerIdForType(typeId: number): Promise<number> {
  const sql = 'select messageServerId from type where id = ?';
  const [row] = await mySql.query(sql, typeId);
  return row ? row.messageServerId : 0;
}

async function getTopicType(topic: string): Promise<string> {
  let type = '';

  const parts = topic.split('/');
  const lastPart = parts[parts.length - 1];
  if (SPECIAL_SUFFIXES.includes(lastPart)) parts.pop();
  const property = parts.pop();

  let parentId = 0;
  let row;
  for (const part of parts) {
    let sql = 'select id, parentId, typeId from instance where name = ?';
    let args = [];
    if (parentId) {
      sql += ' and parentId = ?';
      args = [parentId];
    }
    // eslint-disable-next-line no-await-in-loop
    [row] = await mySql.query(sql, part, ...args);
    if (!row) return '';
    parentId = row.id;
  }

  // If we found the instance for this topic ...
  if (row) {
    // Try to get the type of this instance.
    const {typeId} = row;
    const sql =
      'select enumId, kind from type_data where name = ? and typeId = ?';
    [row] = await mySql.query(sql, property, typeId);
    if (row) {
      if (row.enumId !== null) {
        // It is not a builtin type.
        // Determine if it is an enumerated type.
        const sql = 'select name from enum where id = ?';
        [row] = await mySql.query(sql, row.enumId);
        if (row) type = ENUM_PREFIX + row.name;
      } else {
        type = row.kind;
      }
    }
  }

  if (!type) {
    console.error('failed to get type of topic', topic);
  }

  return type;
}

async function getTypeTopics(typeId: number): Promise<string[]> {
  try {
    const instances = await getInstances(typeId);
    return instances.map(instance => instance.name + '/#');
  } catch (e) {
    logError(e.message);
    return [];
  }
}

function getTopLevelTypesForServer(serverId: number) {
  const sql =
    'select * from type t1, type t2 ' +
    'where t1.messageServerId = ? ' +
    'and t1.parentId = t2.id ' +
    'and t2.name = "root"';
  return mySql.query(sql, serverId);
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
  } else {
    console.error('refresh browser to establish WebSocket connection');
  }
}

async function handleMessage(client, topic: string, message: Buffer) {
  //const ignore = topic === 'thejoveexpress/lights/ambient/feedback';
  //if (ignore) return;

  try {
    const type = await getTopicType(topic);

    //console.log('message length =', message.length);
    const parts = topic.split('/');

    const lastPart = parts[parts.length - 1];
    if (SPECIAL_SUFFIXES.includes(lastPart)) parts.pop();

    if (parts.length < 2) {
      console.info('ignoring message with topic', topic);
      return;
    }

    const property = parts.pop();

    let value;
    switch (type) {
      case 'boolean':
        value = message.readInt8(0);
        if (
          property === 'lifecycle' &&
          lastPart === 'feedback' &&
          value === 1
        ) {
          requestFeedback(client, parts);
        }
        break;

      case 'number':
        value = message.readInt32BE(0);
        break;

      case 'percent': {
        if (message.length !== 8) {
          console.error(
            'received MQTT message with topic',
            topic,
            'which has type percent,',
            'but length is',
            message.length,
            'instead of 8'
          );
          return;
        }

        const rawValue = message.readIntBE(0, 4);
        const maxValue = message.readIntBE(4, 4);
        value = 100 * (rawValue / maxValue);
        break;
      }

      case 'text':
        value = message.toString();
        break;
    }

    if (type.startsWith(ENUM_PREFIX)) {
      value = message.readInt32BE(0);
    }

    if (value !== undefined) {
      console.log(topic, '=', value);
      const path = parts.join(PATH_DELIMITER);
      saveProperty(path, property, value);
    } else {
      console.error('unsupported topic', topic);
    }
  } catch (e) {
    console.error('\nREST server error:', e.message);
    console.error('REST server error: topic =', topic);
    console.error('REST server error: message length =', message.length);
    //process.exit(1); //TODO: only for debugging
  }
}

async function mqttService(connection: MySqlConnection) {
  mySql = connection;

  try {
    const topLevelTypes = await getAllTopLevelTypes();

    for (const type of topLevelTypes) {
      // eslint-disable-next-line no-await-in-loop
      const server = await getMessageServer(type);

      if (server) {
        connect(server, type.id);
      } else {
        console.error(
          `The type "${type.name}" has no associated message server!`
        );
      }
    }
  } catch (e) {
    logError(e.message);
  }
}

function requestFeedback(client, parts: string[]): void {
  const feedbackTopic = parts.join('/') + '/feedback';
  console.info('publishing', feedbackTopic);
  client.publish(feedbackTopic);
}

async function subscribe(serverId: number, typeId: number) {
  const client = clientMap[serverId];
  if (!client) {
    console.error('no client for server id', serverId);
    return;
  }

  const topics = await getTypeTopics(typeId);
  for (const topic of topics) {
    client.subscribe(topic);
    console.info('subscribed to topic', topic);
  }
}

async function unsubscribeFromServer(serverId: number): Promise<void> {
  const types = await getTopLevelTypesForServer(serverId);
  const promises = types.map(type => unsubscribeFromType(serverId, type.id));
  await Promise.all(promises);
}

async function unsubscribeFromType(
  serverId: number,
  typeId: number
): Promise<void> {
  if (!serverId) serverId = await getServerIdForType(typeId);
  const client = clientMap[serverId];

  const topics = await getTypeTopics(typeId);
  for (const topic of topics) {
    client.unsubscribe(topic);
    console.info('unsubscribed from topic', topic);
  }
}

function websocketSetup() {
  const wsServer = new WebSocket.Server({port: 1337});
  console.info('waiting for WebSocket connection');
  wsServer.on('connection', webSocket => {
    console.info('got WebSocket connection');
    ws = webSocket;

    ws.on('close', () => {
      console.info('WebSocket connection closed');
      ws = null;
    });

    ws.on('error', error => {
      if (error.code !== 'ECONNRESET') {
        console.error('WebSocket error:', error.code);
      }
    });

    Object.values(clientMap).forEach(client => {
      // $FlowFixMe - doesn't know about client methods
      client.publish('thejoveexpress/feedback');
      //console.log('mqtt-service.js: published feedback request');
    });
  });
}

websocketSetup();

module.exports = {
  connect,
  disconnect,
  mqttService,
  subscribe,
  unsubscribeFromServer,
  unsubscribeFromType
};
