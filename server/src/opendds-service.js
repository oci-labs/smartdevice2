// @flow

import isEqual from 'lodash/isEqual';
import NexmatixReader from './opendds/opendds-reader.js';

import {getDbConnection} from './database';

import {getInstanceId, updateProperty} from './instance-service';

import {logError} from './util/error-util';

import type {MessageServerType, PrimitiveType} from './types';

const dataReader = new NexmatixReader();

const serverMap = {}; // keys are server ids

let lastChange, mySql, ws, webSocketServer;

export async function connect(server: MessageServerType) {
  const topLevelTypes = await getTopLevelTypes();

  for (const type of topLevelTypes) {
    const typeServer = await getMessageServer(type.messageServerId);
    if (typeServer) {
      console.log(JSON.stringify(server));
      if (typeServer.id === server.id && server.type === 'opendds') {
        connectToType(server, type.id);
      }
    } else {
      console.error(
        `The type "${type.name}" has no associated message server.`
      );
    }
  }
}

function subscribe() {
  console.log('subscribing to opendds');
  dataReader.subscribe(async function(sample) {
    console.log('sample received.');
    if (global.importInProgress) return;

    try {
      const path = `${sample.valveSerialId}`;

      await saveProperty(path, 'pressure', sample.pressure);
      await saveProperty(path, 'cycles', sample.cycles);
      await saveProperty(path, 'leakFault', sample.leakFault);
      await saveProperty(path, 'valveFault', sample.valveFault);
    } catch (e) {
      console.error('\nREST server error:', e.message);
      //process.exit(1); //TODO: only for debugging
    }
  });
  console.log('subscribed to opendds');
}

export function connectToType(server: MessageServerType, typeId: number) {
  console.log(server.type);
  if (!dataReader.participant) {
    dataReader.initializeDds('../rtps_disc_secure.ini');
    dataReader.createParticipant();
    subscribe();
  }
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

function getTopLevelTypes() {
  const sql =
    'select t1.id, t1.name, t1.messageServerId ' +
    'from type t1, type t2 ' +
    'where t1.parentId = t2.id and t2.name = "root"';
  return mySql.query(sql);
}

export async function openddsService(
  app: express$Application,
  wsServer: any
): Promise<void> {
  mySql = getDbConnection();

  try {
    const topLevelTypes = await getTopLevelTypes();

    for (const type of topLevelTypes) {
      const server = await getMessageServer(type.messageServerId);

      console.log(JSON.stringify(server));
      if (server && server.type === 'opendds') {
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

  webSocketSetup(wsServer);
}

async function saveProperty(
  path: string,
  property: string,
  value: PrimitiveType
): Promise<void> {
  if (global.importInProgress) return;

  const instanceId = await getInstanceId(path);
  if (instanceId === 0) {
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

export function webSocketSetup(wsServer: any) {
  webSocketServer = wsServer;
  console.info('waiting for WebSocket connection');
  wsServer.on('connection', webSocket => {
    console.info('got WebSocket connection to browser');
    ws = webSocket;
    if (dataReader.participant) wsSend('OpenDDS connected');

    ws.on('close', () => {
      console.info('WebSocket connection to browser closed');
      ws = null;
    });

    ws.on('error', error => {
      if (error.code !== 'ECONNRESET') {
        console.error('WebSocket error:', error.code);
      }
      console.error(`WebSocket error... ${JSON.stringify(error)}`);
    });

    ws.on('message', async (message: string) => {
      if (message.startsWith('OpenDDS')) {
        const [, command, secure] = message.split(' ');

        try {
          if (command === 'reconnect') {
            console.log('OpenDDS disconnect');
            dataReader.deleteParticipant();

            if (secure === 'secure') {
              console.log('OpenDDS connect: secure');
              dataReader.createParticipant();
              wsSend('OpenDDS connected secure');
              subscribe();
            } else {
              console.log('OpenDDS connect: insecure');
              dataReader.createParticipant(false);
              wsSend('OpenDDS connected insecure');
              subscribe();
            }
          }
        } catch (e) {
          console.log(`Something went wrong: ${JSON.stringify(e)}`);
        }
      }
    });
  });
}

function wsSend(message: string): void {
  try {
    if (ws) ws.send(message);
  } catch (e) {
    console.error('opendds-service.js wsSend:', e.message);
  }
}
