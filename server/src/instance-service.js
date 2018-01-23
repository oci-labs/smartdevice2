// @flow

import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';

import {getDbConnection} from './database';
import {errorHandler} from './util/error-util';

import type {AlertType, AlertTypeType, PrimitiveType} from './types';

const PATH_DELIMITER = '.';
const pathToIdMap = {};

let mySql;

async function createAlerts(
  instanceId: number,
  alertTypes: AlertTypeType[]
): Promise<void> {
  const timestamp = Date.now();

  const promises = alertTypes.map(alertType => {
    const data = {
      alertTypeId: alertType.id,
      description: '',
      dynamic: true,
      instanceId,
      timestamp
    };
    return mySql.insert('alert', data);
  });
  await Promise.all(promises);
}

function deleteDynamicAlerts(instanceId: number): Promise<void> {
  const sql =
    'delete a.* from alert as a ' +
    'left join alert_type as t ' +
    'on a.alertTypeId = t.id ' +
    'where a.instanceId=? and a.dynamic=true and t.sticky=false';
  return mySql.query(sql, instanceId);
}

function deleteInstanceData(instanceId: number): Promise<void> {
  const sql = 'delete from instance_data where instanceId=?';
  return mySql.query(sql, instanceId);
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

function getAlertTypes(typeId: number): Promise<AlertTypeType[]> {
  const sql = 'select * from alert_type where typeId=?';
  return mySql.query(sql, typeId);
}

async function getData(instanceId: number): Promise<Object> {
  const sql = 'select dataKey, dataValue from instance_data where instanceId=?';
  const rows = await mySql.query(sql, instanceId);
  return rows.reduce((data, row) => {
    data[row.dataKey] = row.dataValue;
    return data;
  }, {});
}

async function getInstanceDataHandler(
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

async function getInstanceRootIdHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  try {
    const sql = 'select id from instance where name = "root"';
    const [row] = await mySql.query(sql);
    res.send(String(row ? row.id : 0));
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

async function getParentId(parentName: string): Promise<number> {
  let id = pathToIdMap[parentName];
  if (id) return id;

  const sql = 'select id from instance where name=?';
  const [row] = await mySql.query(sql, parentName);
  if (!row) return 0; // not found
  ({id} = row);
  pathToIdMap[parentName] = id;
  return id;
}

async function getInstanceId(path: string): Promise<number> {
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

function instanceService(app: express$Application): void {
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

function isTriggered(expression: string, instanceData: Object): boolean {
  const assignments = Object.entries(instanceData).map(
    ([key, value]) => `const ${key} = ${String(value)};`
  );
  const code = assignments.join(' ') + ' ' + expression;
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
async function postInstanceDataHandler(
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

  mySql.upsert('instance_data', obj);
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
  const typeId = await getInstanceTypeId(instanceId);
  const alertTypes = await getAlertTypes(typeId);

  // Determine which alerts are triggered by the new data.
  const triggered = alertTypes.filter(alertType =>
    isTriggered(alertType.expression, data)
  );

  const newAlertTypeIds = triggered.map(t => t.id);

  const haveNew = !isEqual(newAlertTypeIds, oldAlertTypeIds);
  if (haveNew) {
    await deleteDynamicAlerts(instanceId);

    // Create all the new alerts that were triggered.
    await createAlerts(instanceId, triggered);
  }

  return haveNew;
}

/**
 * Updates and instance property and returns a boolean
 * indicating whether any alertyts changed.
 */
async function updateProperty(
  instanceId: number,
  property: string,
  value: PrimitiveType
): Promise<boolean> {
  await saveProperty(instanceId, property, value);
  const data = await getData(instanceId);
  return updateAlerts(instanceId, data);
}

module.exports = {
  PATH_DELIMITER,
  getInstanceDataHandler,
  getInstanceId,
  getInstanceRootIdHandler,
  getParentId,
  instanceService,
  postInstanceDataHandler,
  updateProperty
};
