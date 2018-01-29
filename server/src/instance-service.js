// @flow

import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';
import uniq from 'lodash/uniq';

import {getDbConnection} from './database';
import {getEnumsForType} from './enum-service';
import {errorHandler} from './util/error-util';
import {values} from './util/flow-util';

import type {AlertType, AlertTypeType, EnumType, PrimitiveType} from './types';

export const PATH_DELIMITER = '.';
let pathToIdMap = {};

let mySql;

export function clearPathToIdMap() {
  pathToIdMap = {};
}

function convertValue(kind: string, value: string): PrimitiveType {
  switch (kind) {
    case 'boolean':
      return Boolean(Number(value));
    case 'number':
    case 'percent':
      return Number(value);
    case 'text':
      return value;
    default:
      return Number(value); // assume enum
  }
}

async function createAlerts(
  instanceId: number,
  alertTypes: AlertTypeType[]
): Promise<void> {
  const timestamp = Date.now();

  const promises = alertTypes.map(alertType => {
    const data = {
      alertTypeId: alertType.id,
      description: '',
      instanceId,
      sticky: alertType.sticky,
      timestamp
    };
    return mySql.insert('alert', data);
  });
  await Promise.all(promises);
}

function deleteNonStickyAlerts(instanceId: number): Promise<void> {
  const sql =
    'delete a.* from alert as a ' +
    'left join alert_type as t ' +
    'on a.alertTypeId = t.id ' +
    'where a.instanceId=? and a.sticky=false and t.sticky=false';
  return mySql.query(sql, instanceId);
}

function deleteInstanceData(instanceId: number): Promise<void> {
  const sql = 'delete from instance_data where instanceId=?';
  return mySql.query(sql, instanceId);
}

function ensureMySql() {
  if (!mySql) mySql = getDbConnection();
}

function getAlerts(instanceId: number): Promise<AlertType[]> {
  const sql =
    'select a.id, a.instanceId, t.name, a.timestamp ' +
    'from alert a, alert_type t ' +
    'where a.alertTypeId = t.id and a.instanceId=?';
  return mySql.query(sql, instanceId);
}

async function getAlertTypeIds(instanceId: number): Promise<number[]> {
  const sql = 'select alertTypeId from alert where instanceId=?';
  const rows = await mySql.query(sql, instanceId);
  return rows.map(row => row.alertTypeId);
}

async function getAlertTypes(typeId: number): Promise<AlertTypeType[]> {
  const sql = 'select * from alert_type where typeId=?';
  const rows = await mySql.query(sql, typeId);
  return ((rows: any): AlertTypeType[]);
}

async function getData(instanceId: number): Promise<Object> {
  const sql =
    'select id.dataKey, id.dataValue, td.kind, td.enumId ' +
    'from instance i, instance_data id, type_data td ' +
    'where i.id = ? ' +
    'and id.instanceId = i.id ' +
    'and i.typeId = td.typeId ' +
    'and id.dataKey = td.name';
  const rows = await mySql.query(sql, instanceId);
  return rows.reduce((data, row) => {
    const {dataKey, dataValue, kind} = row;
    data[dataKey] = convertValue(kind, dataValue);
    return data;
  }, {});
}

export async function getInstanceChildren(parentId: number): Promise<Object[]> {
  ensureMySql();
  const sql = 'select * from instance where parentId = ?';
  const instances = await mySql.query(sql, parentId);
  return sortBy(instances, ['name']);
}

export async function getInstanceDataHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {instanceId} = req.params;
  const sql = 'select * from instance_data where instanceId=?';
  try {
    const instanceDatas = await mySql.query(sql, instanceId);
    const sorted = sortBy(instanceDatas, ['dataKey']);
    res.send(sorted);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function getInstanceRootId(): Promise<number> {
  ensureMySql();
  const sql = 'select id from instance where name = "root"';
  const [row] = await mySql.query(sql);
  return row ? row.id : 0;
}

export async function getInstanceRootIdHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  try {
    res.send(String(await getInstanceRootId()));
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function getInstanceTypeId(instanceId: number): Promise<number> {
  const sql = 'select typeId from instance where id=?';
  const [row] = await mySql.query(sql, instanceId);
  return row ? Number(row.typeId) : 0;
}

export async function getParentId(parentName: string): Promise<number> {
  let id = pathToIdMap[parentName];
  if (id) return id;

  const sql = 'select id from instance where name=?';
  const [row] = await mySql.query(sql, parentName);
  if (!row) return 0; // not found
  ({id} = row);
  pathToIdMap[parentName] = id;
  return id;
}

export async function getInstanceId(path: string): Promise<number> {
  // If we have seen this path before, returns its id.
  let id = pathToIdMap[path];
  if (id) return id;

  const parts = path.split(PATH_DELIMITER);

  // Get id of first node in path.
  let subpath = parts.shift();
  id = await getParentId(subpath);
  if (id === 0) return 0; // not found

  for (const part of parts) {
    const parentId = id;
    subpath += PATH_DELIMITER + part;
    id = pathToIdMap[subpath];
    if (!id) {
      const sql = 'select id from instance where parentId=? and name=?';
      // eslint-disable-next-line no-await-in-loop
      const [row] = await mySql.query(sql, parentId, part);
      if (!row) return 0; // not found
      ({id} = row);
      pathToIdMap[subpath] = id;
    }
  }

  return id;
}

export async function getTopInstances() {
  const rootId = await getInstanceRootId();
  ensureMySql();
  const sql = 'select * from instance where parentId = ?';
  const instances = await mySql.query(sql, rootId);
  return instances;
}

function getUniqueNames(expression: string): string[] {
  const PROPERTY_NAME_RE = /^[A-Za-z]\w*$/;
  const names = expression
    .split(' ')
    .filter(word => PROPERTY_NAME_RE.test(word));
  return uniq(names);
}

export function instanceService(app: express$Application): void {
  mySql = getDbConnection();

  const URL_PREFIX = '/instances/';
  app.get(URL_PREFIX + 'root', getInstanceRootIdHandler);
  app.get(URL_PREFIX + ':instanceId/data', getInstanceDataHandler);
  app.get(URL_PREFIX + ':instanceId/inuse', inUseHandler);
  app.post(URL_PREFIX + ':instanceId/data', postInstanceDataHandler);
}

async function inUseHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const {instanceId} = req.params;
  const sql = 'select id from instance where parentId = ?';
  try {
    const referIds = await mySql.query(sql, instanceId);
    res.send(referIds.length > 0);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

function isTriggered(
  expression: string,
  instanceData: Object,
  enumsUsed: EnumType[]
): boolean {
  const assigns = {};

  // Get assignments for all enum members used by this expression.
  for (const anEnum of enumsUsed) {
    const members = values(anEnum.memberMap);
    for (const {name, value} of members) {
      assigns[name] = value;
    }
  }

  // Get assignments for all the instance data.
  for (const [name, value] of Object.entries(instanceData)) {
    assigns[name] = value;
  }

  // Get all the variables in the expression
  // for which we know the value.
  const variables = getUniqueNames(expression)
    .filter(name => assigns[name] !== undefined)
    .sort();

  // Create assignment statements for those variables.
  const assignments =
    variables.length === 0
      ? ''
      : 'const ' +
        variables.map(name => `${name} = ${String(assigns[name])}`).join(', ') +
        '; ';

  // Build a string of JavaScript code to execute
  // to detemine if the alert with this expression
  // is triggered.
  const code = assignments + expression;

  try {
    // eslint-disable-next-line no-eval
    const triggered = eval(code);
    return triggered;
  } catch (e) {
    // If the expression references properties that are not set,
    // a ReferenceError will thrown.
    // For now we assume the alert is not triggered.
    if (e instanceof ReferenceError) return false;
    throw e;
  }
}

/**
 * Changes the property values for a given instance
 * and returns the current alerts for that instance.
 */
export async function postInstanceDataHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const instanceId = Number(req.params.instanceId);
  const data = req.body;

  // Get rid of the old data for this instance.
  await deleteInstanceData(instanceId);

  // Save the new data for this instance.
  await saveInstanceData(instanceId, data);

  await updateAlerts(instanceId, data);

  // Return all the alerts for this instance,
  // including sticky ones that were not deleted above.
  const alerts = await getAlerts(instanceId);

  res.send(alerts);
}

async function saveInstanceData(
  instanceId: number,
  data: Object
): Promise<void> {
  const promises = Object.keys(data).map(key => {
    const obj = {
      instanceId,
      dataKey: key,
      dataValue: data[key]
    };
    return mySql.insert('instance_data', obj);
  });
  await Promise.all(promises);
}

async function saveProperty(
  instanceId: number,
  property: string,
  value: PrimitiveType
): Promise<void> {
  const obj = {
    instanceId,
    dataKey: property,
    dataValue: value
  };

  // Get the id of the existing instance_data row if any.
  const sql = 'select id from instance_data where instanceId=? and dataKey=?';
  const [row] = await mySql.query(sql, instanceId, property);
  // $FlowFixMe - allow adding id
  if (row) obj.id = row.id;

  await mySql.upsert('instance_data', obj);
}

/**
 * Updates the alerts for an instance and returns a
 * boolean indicating whether any of its alerts changed.
 */
async function updateAlerts(
  instanceId: number,
  data: Object
): Promise<boolean> {
  const oldAlertTypeIds = await getAlertTypeIds(instanceId);

  // Get all the alert types defined for the type of this instance.
  const typeId: number = await getInstanceTypeId(instanceId);
  const alertTypes: AlertTypeType[] = await getAlertTypes(typeId);
  const enumsUsed = await getEnumsForType(typeId);

  // Determine which alert types are triggered by the new data.
  const triggered = alertTypes.filter(alertType =>
    isTriggered(alertType.expression, data, enumsUsed)
  );

  const newAlertTypeIds = triggered.map(t => t.id);

  const haveNew = !isEqual(newAlertTypeIds, oldAlertTypeIds);
  if (haveNew) {
    await deleteNonStickyAlerts(instanceId);

    await updateDuplicateStickyAlerts(instanceId, triggered);

    // Create all the new alerts that were triggered.
    await createAlerts(instanceId, triggered);
  }

  return haveNew;
}

async function updateDuplicateStickyAlerts(
  instanceId: number,
  triggeredAlertTypes: AlertTypeType[]
): Promise<void> {
  // Get the triggered alert types that are sticky.
  const stickyAlertTypes = triggeredAlertTypes.filter(alert => alert.sticky);

  // Get all the current sticky alerts.
  const sql =
    'select id, alertTypeId from alert where instanceId = ? and sticky = true';
  const existingStickyAlerts = await mySql.query(sql, instanceId);

  for (const stickyAlertType of stickyAlertTypes) {
    const existingAlert = existingStickyAlerts.find(
      alert => alert.alertTypeId === stickyAlertType.id
    );

    if (existingAlert) {
      // Update the timestamp for this alert in the database.
      const changes = {timestamp: Date.now()};
      // eslint-disable-next-line no-await-in-loop
      await mySql.updateById('alert', existingAlert.id, changes);

      // Remove this alert type from the triggeredAlertTypes.
      const index = triggeredAlertTypes.findIndex(
        alert => alert === stickyAlertType
      );
      delete triggeredAlertTypes[index];
    }
  }
}

/**
 * Updates and instance property and returns a boolean
 * indicating whether any alertyts changed.
 */
export async function updateProperty(
  instanceId: number,
  property: string,
  value: PrimitiveType
): Promise<boolean> {
  await saveProperty(instanceId, property, value);
  const data = await getData(instanceId);
  return updateAlerts(instanceId, data);
}
