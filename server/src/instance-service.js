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
  app.post(URL_PREFIX, postInstanceDataHandler.bind(null, mySql));
}

async function postInstanceDataHandler(
  mySql: MySqlConnection,
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {instanceId} = req.params;
  const data = req.body;

  // Delete all the data for this instance.
  const tableName = 'instance_data';
  const sql = `delete from ${tableName} where instanceId = ?`;
  await mySql.query(sql, instanceId);

  // Save new data for this instance.
  const promises = Object.keys(data).map(key => {
    const obj = {
      instanceId,
      dataKey: key,
      dataValue: data[key]
    };
    return mySql.insert(tableName, obj);
  });
  await Promise.all(promises);
  res.send();
}

module.exports = {
  instanceService,
  getInstanceDataHandler,
  postInstanceDataHandler
};
