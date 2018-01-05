// @flow

const MySqlConnection = require('mysql-easier');

const {errorHandler} = require('./util/error-util');

async function getTypeDataHandler(
  mySql: MySqlConnection,
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {typeId} = req.params;
  const sql = 'select * from type_data where typeId = ?';
  try {
    const typeDatas = await mySql.query(sql, typeId);
    res.send(typeDatas);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

function typeService(app: express$Application, mySql: MySqlConnection): void {
  const URL_PREFIX = '/types/:typeId/data';
  app.get(URL_PREFIX, getTypeDataHandler.bind(null, mySql));
}

module.exports = {
  typeService,
  getTypeDataHandler
};
