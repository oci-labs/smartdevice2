// @flow

import isEqual from 'lodash/isEqual';
import NexmatixReader from './opendds/opendds-reader.js'

import {getDbConnection} from './database';

import {
  getInstanceId,
  updateProperty
} from './instance-service';

import {logError} from './util/error-util';

import type {MessageServerType, PrimitiveType} from './types';

const dataReader = new NexmatixReader();

const serverMap = {}; // keys are server ids

let lastChange,
  mySql,
  ws;

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

export function connectToType(server: MessageServerType, typeId: number) {
  console.log(server.type);
  if (!dataReader.participant) {
    console.log("initializing DDS");
    dataReader.initializeDds('../rtps_disc.ini');

    dataReader.subscribe(async function (sample) {
      console.log(`sample received: ${JSON.stringify(sample)}`);
      if (global.importInProgress) return;


      try{
        const path = `${sample.valveSerialId}`;

        console.log(`saveProperty("${path}", "pressure", ${sample.pressure})`);
        await saveProperty(path, "pressure", sample.pressure);
        console.log(`saveProperty("${path}", "cycles", ${sample.cycles})`);
        await saveProperty(path, "cycles", sample.cycles);
        console.log(`saveProperty("${path}", "leakFault", ${sample.leakFault})`);
        await saveProperty(path, "leakFault", sample.leakFault);
        console.log(`saveProperty("${path}", "valveFault", ${sample.valveFault})`);
        await saveProperty(path, "valveFault", sample.valveFault);
      } catch (e) {
        console.error('\nREST server error:', e.message);
        //process.exit(1); //TODO: only for debugging
      }
    });
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

export async function openddsService(app: express$Application, wsServer: any): Promise<void> {
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

export function webSocketSetup(wsServer: any) {
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
