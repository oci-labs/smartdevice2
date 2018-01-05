// @flow

const sortBy = require('lodash/sortBy');
const MySqlConnection = require('mysql-easier');

const {errorHandler} = require('./util/error-util');

async function getInstanceDataHandler(
  mySql: MySqlConnection,
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {instanceId} = req.params;
  const sql = 'select * from instance_data where instanceId = ?';
  try {
    const instanceDatas = await mySql.query(sql, instanceId);
    const sorted = sortBy(instanceDatas, ['dataKey']);
    res.send(sorted);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

function instanceService(
  app: express$Application,
  mySql: MySqlConnection
): void {
  const URL_PREFIX = '/instances/:instanceId/data';
  app.get(URL_PREFIX, getInstanceDataHandler.bind(null, mySql));
}

module.exports = {
  instanceService,
  getInstanceDataHandler
};
