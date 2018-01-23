// @flow

import sortBy from 'lodash/sortBy';

import {mySql} from './database';
import {errorHandler} from './util/error-util';

import type {EnumType} from './types';

function enumService(app: express$Application): void {
  const URL_PREFIX = '/enums';
  app.get(URL_PREFIX, getEnumsHandler);
  app.get(URL_PREFIX + '/:enumId', getEnumValuesHandler);
}

async function getEnums(): Promise<EnumType[]> {
  const enums = await mySql.query('select * from enum');

  // Build the memberMap for each enum.
  const sql = 'select * from enum_member where enumId = ?';
  const promises = enums.map(anEnum => mySql.query(sql, anEnum.id));
  const enumMembersArr = await Promise.all(promises);
  enums.forEach((anEnum, index) => {
    const enumMembers = enumMembersArr[index];
    anEnum.memberMap = enumMembers.reduce((map, enumMember) => {
      map[enumMember.id] = enumMember;
      return map;
    }, {});
  });

  return sortBy(enums, ['name']);
}

async function getEnumsHandler(
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

async function getEnumValuesHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {enumId} = req.params;
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

module.exports = {
  enumService,
  getEnums,
  getEnumsHandler,
  getEnumValuesHandler
};
