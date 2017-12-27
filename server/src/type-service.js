// @flow

const MySqlConnection = require('mysql-easier');

const {errorHandler} = require('./util/error-util');

//const inTest = process.env.NODE_ENV === 'test';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'smartdevice'
};
const mySql = new MySqlConnection(dbConfig);

async function deleteByIdHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {id} = req.params;
  try {
    const rowCount: number = await mySql.deleteById('type', id);
    res.send(String(rowCount));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function createHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  try {
    const rows = await mySql.getAll('type');
    res.send(JSON.stringify(rows));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function getAllHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  try {
    const rows = await mySql.getAll('type');
    res.send(JSON.stringify(rows));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function getByIdHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {id} = req.params;
  try {
    const type = await mySql.getById('user', id);
    res.status(type ? 200 : 404).send(JSON.stringify(type));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

function typeService(app: express$Application): void {
  const URL_PREFIX = '/types';

  app.delete(URL_PREFIX + '/:id', deleteByIdHandler);
  app.get(URL_PREFIX, getAllHandler);
  app.get(URL_PREFIX + '/:id', getByIdHandler);
  app.post(URL_PREFIX, createHandler);
}

module.exports = {
  createHandler,
  deleteByIdHandler,
  getAllHandler,
  getByIdHandler,
  typeService
};
