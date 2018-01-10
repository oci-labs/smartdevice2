// @flow

const MySqlConnection = require('mysql-easier');

const {errorHandler} = require('./util/error-util');

async function getByInstanceHandler(
  mySql: MySqlConnection,
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {instanceId} = req.params;
  const sql =
    'select a.instanceId, t.name, a.timestamp ' +
    'from alert a, alert_type t ' +
    'where instanceId = ?';
  try {
    const alerts = await mySql.query(sql, instanceId);
    res.send(alerts);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

function alertService(app: express$Application, mySql: MySqlConnection): void {
  const URL_PREFIX = '/alerts/:instanceId';

  app.get(URL_PREFIX, getByInstanceHandler.bind(null, mySql));
}

module.exports = {
  alertService,
  getByInstanceHandler
};
