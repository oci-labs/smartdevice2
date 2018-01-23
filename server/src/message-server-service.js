// @flow

import {getDbConnection} from './database';
import {connect, disconnect} from './mqtt-service';
import {errorHandler} from './util/error-util';

async function addServerHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const server = req.body;
  const mySql = getDbConnection();

  try {
    const id = await mySql.insert('message_server', server);
    server.id = id;
    connect(server);
    res.send(String(id));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function deleteServerHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {serverId} = req.params;
  const mySql = getDbConnection();

  try {
    const server = await mySql.getById('message_server', serverId);
    await mySql.deleteById('message_server', serverId);
    disconnect(server);
    res.send();
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

function messageServerService(app: express$Application): void {
  const URL_PREFIX = '/messageServers';
  app.delete(URL_PREFIX + '/:serverId', deleteServerHandler);
  app.post(URL_PREFIX, addServerHandler);
}

module.exports = {
  addServerHandler,
  deleteServerHandler,
  messageServerService
};
