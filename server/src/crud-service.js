// @flow

const MySqlConnection = require('mysql-easier');

const {errorHandler} = require('./util/error-util');

const NOT_FOUND = 404;
const OK = 200;

function crudService(
  app: express$Application,
  mySql: MySqlConnection,
  tableName: string
) {

  async function deleteAllHandler(
    req: express$Request,
    res: express$Response
  ): Promise<void> {
    try {
      await mySql.deleteAll(tableName);
      res.send();
    } catch (e) {
      // istanbul ignore next
      errorHandler(res, e);
    }
  }

  async function deleteByIdHandler(
    req: express$Request,
    res: express$Response
  ): Promise<void> {
    const {id} = req.params;
    try {
      const {affectedRows} = await mySql.deleteById(tableName, id);
      res.send(String(affectedRows));
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
      const rows = await mySql.getAll(tableName);
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
      const type = await mySql.getById(tableName, id);
      res.status(type ? OK : NOT_FOUND).send(JSON.stringify(type));
    } catch (e) {
      // istanbul ignore next
      errorHandler(res, e);
    }
  }

  async function patchHandler(
    req: express$Request,
    res: express$Response
  ): Promise<void> {
    const {id} = req.params;
    const changes = req.body;
    try {
      const type = await mySql.getById(tableName, id);
      const newType = {...type, ...changes};
      await mySql.updateById(tableName, id, newType);
      res.status(OK).send(JSON.stringify(newType));
    } catch (e) {
      // istanbul ignore next
      errorHandler(res, e);
    }
  }

  async function postHandler(
    req: express$Request,
    res: express$Response
  ): Promise<void> {
    try {
      const rows = await mySql.insert(tableName, req.body);
      res.send(JSON.stringify(rows));
    } catch (e) {
      // istanbul ignore next
      errorHandler(res, e);
    }
  }

  const URL_PREFIX = '/' + tableName;
  app.delete(URL_PREFIX, deleteAllHandler);
  app.delete(URL_PREFIX + '/:id', deleteByIdHandler);
  app.get(URL_PREFIX, getAllHandler);
  app.get(URL_PREFIX + '/:id', getByIdHandler);
  app.patch(URL_PREFIX + '/:id', patchHandler);
  app.post(URL_PREFIX, postHandler);
}

module.exports = crudService;
