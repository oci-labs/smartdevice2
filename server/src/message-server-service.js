// @flow

import {getDbConnection} from './database';
import {connect, disconnect} from './mqtt-service';
import {errorHandler} from './util/error-util';

const TABLE = 'message_server';

let mySql;

function ensureMySql() {
  if (!mySql) mySql = getDbConnection();
}

export async function addServerHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const server = req.body;
  ensureMySql();

  try {
    const id = await mySql.insert(TABLE, server);
    server.id = id;
    connect(server);
    res.send(String(id));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

export async function deleteServerHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {serverId} = req.params;
  ensureMySql();

  try {
    const server = await mySql.getById(TABLE, serverId);
    await mySql.deleteById(TABLE, serverId);
    disconnect(server);
    res.send();
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

export function getServers() {
  ensureMySql();
  return mySql.getAll(TABLE);
}

export function messageServerService(app: express$Application): void {
  const URL_PREFIX = '/messageServers';
  app.delete(URL_PREFIX + '/:serverId', deleteServerHandler);
  app.post(URL_PREFIX, addServerHandler);
}
