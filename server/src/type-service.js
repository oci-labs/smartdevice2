// @flow

const sortBy = require('lodash/sortBy');
const MySqlConnection = require('mysql-easier');

const {errorHandler} = require('./util/error-util');

let mySql;

async function getTypeAlertsHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {typeId} = req.params;
  const sql = 'select * from alert_type where typeId = ?';
  try {
    const conditions = await mySql.query(sql, typeId);
    const sorted = sortBy(conditions, ['name']);
    res.send(sorted);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function getTypeDataHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {typeId} = req.params;
  const sql = 'select * from type_data where typeId = ?';
  try {
    const typeDatas = await mySql.query(sql, typeId);
    const sorted = sortBy(typeDatas, ['name']);
    res.send(sorted);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function inUseHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {typeId} = req.params;
  const sql = 'select id from type where parentId = ?';
  try {
    let referIds = await mySql.query(sql, typeId);
    if (referIds.length === 0) {
      const sql = 'select id from instance where typeId = ?';
      referIds = await mySql.query(sql, typeId);
    }
    res.send(referIds.length > 0);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

function typeService(
  app: express$Application,
  connection: MySqlConnection
): void {
  mySql = connection;
  const URL_PREFIX = '/types/:typeId/';
  app.get(URL_PREFIX + 'inuse', inUseHandler);
  app.get(URL_PREFIX + 'data', getTypeDataHandler);
  app.get(URL_PREFIX + 'alerts', getTypeAlertsHandler);
}

module.exports = {
  typeService,
  getTypeDataHandler
};
