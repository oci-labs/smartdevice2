// @flow

const MySqlConnection = require('mysql-easier');

const {errorHandler} = require('./util/error-util');

//const inTest = process.env.NODE_ENV === 'test';

const NOT_FOUND = 404;
const OK = 200;

async function deleteByIdHandler(
  mySql: MySqlConnection,
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {id, kind} = req.params;
  try {
    // Cascading deletes in database take care of
    // deleting all descendant types.
    const {affectedRows} = await mySql.deleteById(kind, id);
    res.send(String(affectedRows));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function createHandler(
  mySql: MySqlConnection,
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {kind} = req.params;
  try {
    const obj = JSON.parse(req.body);
    const rows = await mySql.insert(kind, obj);
    res.send(JSON.stringify(rows));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function getAllHandler(
  mySql: MySqlConnection,
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {kind} = req.params;
  try {
    const rows = await mySql.getAll(kind);
    res.send(JSON.stringify(rows));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function getByIdHandler(
  mySql: MySqlConnection,
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {id, kind} = req.params;
  try {
    const type = await mySql.getById(kind, id);
    res.status(type ? OK : NOT_FOUND).send(JSON.stringify(type));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function patchHandler(
  mySql: MySqlConnection,
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {id, kind} = req.params;
  const changes = req.body;
  try {
    const type = await mySql.getById(kind, id);
    const newType = {...type, ...changes};
    await mySql.updateById(kind, id, newType);
    res.status(OK).send(JSON.stringify(newType));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

function treeService(app: express$Application, mySql: MySqlConnection): void {
  const URL_PREFIX = '/tree/:kind';

  app.delete(URL_PREFIX + '/:id', deleteByIdHandler.bind(null, mySql));
  app.get(URL_PREFIX, getAllHandler.bind(null, mySql));
  app.get(URL_PREFIX + '/:id', getByIdHandler.bind(null, mySql));
  app.patch(URL_PREFIX + '/:id', patchHandler.bind(null, mySql));
  app.post(URL_PREFIX, createHandler.bind(null, mySql));
}

module.exports = {
  createHandler,
  deleteByIdHandler,
  getAllHandler,
  getByIdHandler,
  patchHandler,
  treeService
};
