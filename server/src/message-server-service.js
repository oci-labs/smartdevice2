// @flow

const MySqlConnection = require('mysql-easier');

const {connect, disconnect} = require('./mqtt-service');
const {errorHandler} = require('./util/error-util');

let mySql;

async function addServerHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const server = req.body;

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

function messageServerService(
  app: express$Application,
  connection: MySqlConnection
): void {
  mySql = connection;
  const URL_PREFIX = '/messageServers';
  app.delete(URL_PREFIX + '/:serverId', deleteServerHandler);
  app.post(URL_PREFIX, addServerHandler);
}

module.exports = {
  addServerHandler,
  deleteServerHandler,
  messageServerService
};
