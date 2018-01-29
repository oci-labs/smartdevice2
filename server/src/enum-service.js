// @flow

import sortBy from 'lodash/sortBy';

import {getDbConnection} from './database';
import {errorHandler} from './util/error-util';

import type {EnumMemberMapType, EnumType} from './types';

let mySql;

function ensureMySql() {
  if (!mySql) mySql = getDbConnection();
}

export function enumService(app: express$Application): void {
  mySql = getDbConnection();
  const URL_PREFIX = '/enums';
  app.get(URL_PREFIX, getEnumsHandler);
  app.get(URL_PREFIX + '/:enumId', getEnumValuesHandler);
}

async function getEnumMemberMap(enumId: number): Promise<EnumMemberMapType> {
  const sql = 'select * from enum_member where enumId = ?';
  const members = await mySql.query(sql, enumId);
  return members.reduce((map, enumMember) => {
    map[enumMember.id] = enumMember;
    return map;
  }, {});
}

export async function getEnums(): Promise<EnumType[]> {
  ensureMySql();
  const enums = await mySql.query('select * from enum');

  // Build the memberMap for each enum.
  const promises = enums.map(anEnum => getEnumMemberMap(anEnum.id));
  const memberMaps = await Promise.all(promises);
  enums.forEach((anEnum, index) =>
    anEnum.memberMap = memberMaps[index]);

  return sortBy(enums, ['name']);
}

export async function getEnumsForType(typeId: number): Promise<EnumType[]> {
  ensureMySql();
  const sql =
    'select e.id ' +
    'from enum e, type_data td ' +
    'where td.typeId = ? and td.enumId = e.id';
  const enums = await mySql.query(sql, typeId);

  // Build the memberMap for each of these enums.
  const promises = enums.map(anEnum => getEnumMemberMap(anEnum.id));
  const memberMaps = await Promise.all(promises);
  enums.forEach((anEnum, index) =>
    anEnum.memberMap = memberMaps[index]);

  return enums;
}

export async function getEnumsHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  try {
    res.send(await getEnums());
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

export async function getEnumValuesHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {enumId} = req.params;
  ensureMySql();
  const sql = 'select * from enum_value where enumId = ?';
  try {
    const enumValues = await mySql.query(sql, enumId);
    const sorted = sortBy(enumValues, ['value']);
    res.send(sorted);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}
