// @flow
/* eslint-disable no-await-in-loop */

// Before running this,
// 1) start Mosquitto broker (or verify that it is running)
// 2) optionally enter "java -jar TheJoveExpress.jar"
//    to get lots of messages

import isEqual from 'lodash/isEqual';
import mqtt from 'mqtt';
import WebSocket from 'ws';

import {getDbConnection} from './database';
import {
  PATH_DELIMITER,
  getInstanceId,
  updateProperty
} from './instance-service';
import {logError} from './util/error-util';

import type {MessageServerType, PrimitiveType} from './types';

const ENUM_PREFIX = 'enum:';
const SPECIAL_SUFFIXES = ['control', 'feedback'];

const clientMap = {}; // keys are server ids
const serverMap = {}; // keys are server ids

let lastChange,
  mqttConnected = false,
  mySql,
  ws;

export async function connect(server: MessageServerType) {
  const topLevelTypes = await getTopLevelTypes();

  for (const type of topLevelTypes) {
    const typeServer = await getMessageServer(type.messageServerId);
    if (typeServer) {
      if (typeServer.id === server.id && server.type === 'mqtt') {
        connectToType(server, type.id);
      }
    } else {
      console.error(
        `The type "${type.name}" has no associated message server.`
      );
    }
  }
}

export function connectToType(server: MessageServerType, typeId: number) {
  let connectionAttempts = 0;
  const {id} = server;
  serverMap[id] = server;

  const client = clientMap[id];
  if (client) {
    // already connected
    subscribe(id, typeId);
  } else {
    const port = server.port || 1883;
    const url = `mqtt://${server.host}:${port}`;
    const options = {};

    connectionAttempts++;
    wsSend('MQTT attempts ' + connectionAttempts);
    const client = mqtt.connect(url, options);
    clientMap[id] = client;

    client.on('connect', () => {
      connectionAttempts = 0;
      console.info(`MQTT server ${url} connected.`);
      mqttConnected = true;
      wsSend('MQTT connected');
      subscribe(id, typeId);
    });

    client.on('message', handleMessage.bind(null, client));

    client.on('close', () => {
      console.info(`MQTT server ${url} connection closed.`);
      if (mqttConnected) wsSend('MQTT closed');
      mqttConnected = false;
    });
    client.on('error', err => {
      console.error(`MQTT server ${url} error:`, err);
    });
    client.on('offline', () => {
      console.info(`MQTT server ${url} is offline.`);
    });
    client.on('reconnect', () => {
      connectionAttempts++;
      wsSend('MQTT attempts ' + connectionAttempts);
      console.info(`MQTT server ${url} reconnect started.`);
    });
  }
}

export function disconnect(server: MessageServerType) {
  const client = clientMap[server.id];
  if (client) {
    delete clientMap[server.id];
    client.end();
    const port = server.port || 1883;
    const url = `mqtt://${server.host}:${port}`;
    console.info('disconnected from', url);
  }
}

function encode(type: string, value: string, max?: string): Buffer {
  return type === 'text'
    ? Buffer.from(value)
    : encodeNumber(type, Number(value), Number(max));
}

function encodeNumber(type: string, value: number, max?: number): Buffer {
  let buffer;

  switch (type) {
    case 'boolean':
      buffer = Buffer.alloc(1);
      buffer.writeInt8(value, 0);
      break;

    case 'number':
      buffer = Buffer.alloc(4);
      buffer.writeInt32BE(value, 0);
      break;

    case 'percent': {
      if (!max) {
        throw new Error(
          'mqtt-service encodeNumber: percent type requires max value'
        );
      }
      buffer = Buffer.alloc(8);
      buffer.writeInt32BE(value, 0);
      buffer.writeInt32BE(max, 4);
      break;
    }

    default:
      throw new Error(
        'mqttService encodeNumber: ' + type + 'is not a numeric type'
      );
  }

  return buffer;
}

function getInstances(typeId: number) {
  const sql = 'select name from instance where typeId=?';
  return mySql.query(sql, typeId);
}

async function getMessageServer(serverId: number) {
  if (!serverMap[serverId]) {
    try {
      const sql = 'select * from message_server where id=?';
      const [server] = await mySql.query(sql, serverId);
      serverMap[serverId] = server;
    } catch (e) {
      logError(e.message);
    }
  }

  return serverMap[serverId];
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

  // "control" messages are train-specific.
  if (lastPart === 'control') return '';

  if (SPECIAL_SUFFIXES.includes(lastPart)) parts.pop();
  const property = parts.pop();
  if (parts.length === 0) return '';

  let parentId = 0;
  let row;

  for (const part of parts) {
    let sql = 'select id, parentId, typeId from instance where name = ?';
    let args = [];
    if (parentId) {
      sql += ' and parentId = ?';
      args = [parentId];
    }
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
    } else {
      // no row found
      console.error(
        'mqtt-service.js getTopicType:',
        'no type_data record found for',
        property,
        'with typeId =',
        typeId
      );
    }
  }

  if (!type) console.error('topic', topic, 'has no type');

  return type;
}

function getTopLevelTypes() {
  const sql =
    'select t1.id, t1.name, t1.messageServerId ' +
    'from type t1, type t2 ' +
    'where t1.parentId = t2.id and t2.name = "root"';
  return mySql.query(sql);
}

function getTopLevelTypesForServer(serverId: number) {
  const sql =
    'select * from type t1, type t2 ' +
    'where t1.messageServerId = ? ' +
    'and t1.parentId = t2.id ' +
    'and t2.name = "root"';
  return mySql.query(sql, serverId);
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

async function handleMessage(client, topic: string, message: Buffer) {
  if (global.importInProgress) return;

  //const ignore = topic === 'thejoveexpress/lights/ambient/feedback';
  //if (ignore) return;

  try {
    const type = await getTopicType(topic);
    if (!type) return;

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
        value = Boolean(message.readInt8(0));
        // If we get a lifecycle message with a value of true
        // (train-specific) ...
        if (
          property === 'lifecycle' &&
          lastPart === 'feedback' &&
          value === 1
        ) {
          // Request messages to get the current state of everything.
          client.publish(parts[0] + '/feedback');
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
      //if (topic.includes('light') && topic.includes('power')) {
      //console.log(topic, '=', value);
      //}

      const path = parts.join(PATH_DELIMITER);
      await saveProperty(path, property, value);
    } else {
      console.error('unsupported topic', topic);
    }
  } catch (e) {
    console.error('\nREST server error:', e.message);
    console.error('REST server error: topic =', topic);
    //process.exit(1); //TODO: only for debugging
  }
}

export async function mqttService(app: express$Application): Promise<void> {
  mySql = getDbConnection();

  try {
    const topLevelTypes = await getTopLevelTypes();

    for (const type of topLevelTypes) {
      const server = await getMessageServer(type.messageServerId);

      if (server) {
        connectToType(server, type.id);
      } else {
        console.error(
          `The type "${type.name}" has no associated message server!`
        );
      }
    }
  } catch (e) {
    logError(e.message);
  }

  // Request feedback from all current clients.
  // This is train-specific.
  const URL_PREFIX = '/mqtt/feedback';
  app.post(URL_PREFIX, async (req: express$Request, res: express$Response) => {
    await requestFeedback();
    res.send();
  });
}

async function requestFeedback() {
  const topLevelTypes = await getTopLevelTypes();

  for (const {id, messageServerId} of topLevelTypes) {
    const client = clientMap[messageServerId];
    if (client) {
      const instances = await getInstances(id);
      for (const instance of instances) {
        const msg = instance.name + '/feedback';
        console.info('mqtt-service.js: publishing', msg);
        client.publish(msg);
      }
    }
  }
}

async function saveProperty(
  path: string,
  property: string,
  value: PrimitiveType
): Promise<void> {
  if (global.importInProgress) return;

  const instanceId = await getInstanceId(path);
  if (instanceId === 0) {
    console.error('no instance found for', path);
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
    console.error('no WebSocket connection to browser');
  }
}

export async function subscribe(serverId: number, typeId: number) {
  const client = clientMap[serverId];
  if (!client) {
    console.error('no client for server id', serverId);
    const server = await getMessageServer(serverId);
    connect(server);
    return;
  }

  const topics = await getTypeTopics(typeId);
  for (const topic of topics) {
    client.subscribe(topic);
    console.info('subscribed to topic', topic);
  }
}

export async function unsubscribeFromServer(serverId: number): Promise<void> {
  const types = await getTopLevelTypesForServer(serverId);
  const promises = types.map(type => unsubscribeFromType(serverId, type.id));
  await Promise.all(promises);
}

export async function unsubscribeFromType(
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

export function webSocketSetup() {
  const wsServer = new WebSocket.Server({port: 1337});
  console.info('waiting for WebSocket connection');
  wsServer.on('connection', webSocket => {
    console.info('got WebSocket connection to browser');
    ws = webSocket;
    if (Object.keys(clientMap).length) wsSend('MQTT connected');

    ws.on('close', () => {
      console.info('WebSocket connection to browser closed');
      wsSend('MQTT closed');
      ws = null;
    });

    ws.on('error', error => {
      if (error.code !== 'ECONNRESET') {
        console.error('WebSocket error:', error.code);
      }
    });

    ws.on('message', async (message: string) => {
      if (message.startsWith('set')) {
        const [, topic, , value, max] = message.split(' ');
        //console.log('mqtt-service.js x: topic =', topic);

        const topLevelTypes = await getTopLevelTypes();
        for (const {messageServerId} of topLevelTypes) {
          //TODO: Verify this is a train client?
          const client = clientMap[messageServerId];
          if (client) {
            const buffer = encode('percent', value, max);
            client.publish(topic, buffer);
          }
        }
      }
    });

    requestFeedback();
  });
}

function wsSend(message: string): void {
  try {
    if (ws) ws.send(message);
  } catch (e) {
    console.error('mqtt-service.js wsSend:', e.message);
  }
}
