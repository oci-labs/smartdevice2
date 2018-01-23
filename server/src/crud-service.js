// @flow

import {mySql} from './database';
import {errorHandler} from './util/error-util';

const NOT_FOUND = 404;
const OK = 200;

/**
 * This implements CRUD REST services for a given database table.
 * It currently has the following limitations:
 * 1) Only MySQL databases are supported.
 * 2) The table must have an "id" column
 *    that is an "int auto_increment primary key".
 */
function crudService(app: express$Application, tableName: string) {

  /**
   * This code works, but should it be provided?
   */
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

  async function queryHandler(
    req: express$Request,
    res: express$Response
  ): Promise<void> {
    const whereClause = req.body;
    //TODO: Should we be concerned about SQL injection here?
    const sql = `select * from ${tableName} where ${whereClause}`;
    try {
      const rows = await mySql.query(sql);
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
  app.get(URL_PREFIX + '/query', queryHandler);
  app.get(URL_PREFIX + '/:id', getByIdHandler);
  app.patch(URL_PREFIX + '/:id', patchHandler);
  app.post(URL_PREFIX, postHandler);
}

module.exports = crudService;
