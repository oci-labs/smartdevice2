// @flow

import sortBy from 'lodash/sortBy';

import {getDbConnection} from './database';
import {
  subscribe,
  unsubscribeFromServer,
  unsubscribeFromType
} from './mqtt-service';
import {BUILTIN_TYPES} from './types';
import {errorHandler} from './util/error-util';

let mySql;

function ensureMySql() {
  if (!mySql) mySql = getDbConnection();
}

export async function getTopTypes() {
  const rootId = await getTypeRootId();
  ensureMySql();
  const sql = 'select * from type where parentId = ?';
  const types = await mySql.query(sql, rootId);
  return types;
}

export async function getTypeAlerts(typeId: number): Promise<Object[]> {
  ensureMySql();
  const sql = 'select * from alert_type where typeId = ?';
  const alertTypes = await mySql.query(sql, typeId);
  return sortBy(alertTypes, ['name']);
}

async function getTypeAlertsHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {typeId} = req.params;
  try {
    res.send(await getTypeAlerts(Number(typeId)));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

export async function getTypeChildren(parentId: number): Promise<Object[]> {
  ensureMySql();
  const sql = 'select * from type where parentId = ?';
  const types = await mySql.query(sql, parentId);
  return sortBy(types, ['name']);
}

export async function getTypeName(typeId: number): Promise<string> {
  ensureMySql();
  const sql = 'select name from type where id = ?';
  const [row] = await mySql.query(sql, typeId);
  if (!row) throw new Error('invalid type id ' + typeId);
  return row.name;
}

export async function getTypeProperties(typeId: number): Promise<Object[]> {
  ensureMySql();
  const sql = 'select * from type_data where typeId = ?';
  const properties = await mySql.query(sql, typeId);
  return sortBy(properties, ['name']);
}

export async function getTypeDataHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {typeId} = req.params;
  try {
    res.send(await getTypeProperties(Number(typeId)));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function getTypeNamesHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  try {
    const enumNames = await mySql.query('select name from enum');
    const names = [
      ...BUILTIN_TYPES,
      ...enumNames.map(obj => obj.name)
    ];
    names.sort();
    res.send(names);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function getTypeRootId(): Promise<number> {
  ensureMySql();
  const sql = 'select id from type where name = "root"';
  const [row] = await mySql.query(sql);
  return row ? row.id : 0;
}

async function getTypeRootIdHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  try {
    const id = await getTypeRootId();
    res.send(String(id));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function getTypesUsingEnumHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {enumId} = req.params;
  const sql = 'select t.name ' +
    'from type t, type_data td ' +
    'where td.enumId = ? and t.id = td.typeId';
  try {
    const types = await mySql.query(sql, enumId);
    const sorted = sortBy(types, ['name']);
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

async function setServerHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {serverId: s, typeId: t} = req.params;

  // serverId set to zero means clear messageServerId
  // for the specified type.
  const serverId = Number(s); // zero to clear

  // typeId set to zero means clear the messageServerId
  // for all types that use the value in serverId.
  const typeId = Number(t);

  let sql = 'update type set messageServerId = ';
  const args = [];

  if (serverId === 0) {
    if (typeId === 0) {
      throw new Error('serverId or typeId must be set');
    }

    // Clear message server for a specific type.
    sql += 'null where id=?';
    args.push(typeId);
    unsubscribeFromType(serverId, typeId);
  } else if (typeId === 0) {
    // Clear message server for all top-level types
    // that currently use it.
    sql += 'null where messageServerId = ?';
    args.push(serverId);
    unsubscribeFromServer(serverId);
  } else {
    // Set message server for a specific type.
    sql += '? where id = ?';
    args.push(serverId, typeId);
    subscribe(serverId, typeId);
  }
  args.unshift(sql);

  try {
    await mySql.query(...args);
    res.send();
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

export function typeService(app: express$Application): void {
  mySql = getDbConnection();

  const URL_PREFIX = '/types/';
  app.get(URL_PREFIX + 'enums/used-by/:enumId', getTypesUsingEnumHandler);
  app.get(URL_PREFIX + 'names', getTypeNamesHandler);
  app.get(URL_PREFIX + 'root', getTypeRootIdHandler);
  app.get(URL_PREFIX + ':typeId/inuse', inUseHandler);
  app.get(URL_PREFIX + ':typeId/data', getTypeDataHandler);
  app.get(URL_PREFIX + ':typeId/alerts', getTypeAlertsHandler);
  app.put(URL_PREFIX + ':typeId/server/:serverId', setServerHandler);
}
