// @flow

const sortBy = require('lodash/sortBy');
const MySqlConnection = require('mysql-easier');

const {errorHandler} = require('./util/error-util');

async function getTypeAlertsHandler(
  mySql: MySqlConnection,
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
  mySql: MySqlConnection,
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

function typeService(app: express$Application, mySql: MySqlConnection): void {
  const URL_PREFIX = '/types/:typeId/';
  app.get(URL_PREFIX + 'data', getTypeDataHandler.bind(null, mySql));
  app.get(URL_PREFIX + 'alerts', getTypeAlertsHandler.bind(null, mySql));
}

module.exports = {
  typeService,
  getTypeDataHandler
};
