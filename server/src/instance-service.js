// @flow

const sortBy = require('lodash/sortBy');
const MySqlConnection = require('mysql-easier');

const {errorHandler} = require('./util/error-util');

import type {AlertType, AlertTypeType} from './types';

let mySql;

async function createAlerts(
  instanceId: number,
  alertTypes: AlertTypeType[]
): Promise<AlertType[]> {
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

  const alerts = alertTypes.map(alertType => ({
    instanceId,
    name: alertType.name,
    timestamp
  }));

  return alerts;
}

function deleteDynamicAlerts(instanceId: number): Promise<void> {
  const sql = 'delete from alert where instanceId=? and dynamic=true';
  return mySql.query(sql, instanceId);
}

function deleteInstanceData(instanceId: number): Promise<void> {
  const sql = 'delete from instance_data where instanceId=?';
  return mySql.query(sql, instanceId);
}

function getAlertTypes(typeId: number): Promise<AlertTypeType[]> {
  const sql = 'select * from alert_type where typeId=?';
  return mySql.query(sql, typeId);
}

async function getInstanceDataHandler(
  mySql: MySqlConnection,
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

async function getInstanceTypeId(instanceId: number): Promise<number> {
  const sql = 'select typeId from instance where id=?';
  const rows = await mySql.query(sql, instanceId);
  const [{typeId}] = rows;
  return Number(typeId);
}

function instanceService(
  app: express$Application,
  mySql: MySqlConnection
): void {
  const URL_PREFIX = '/instances/:instanceId/data';
  app.get(URL_PREFIX, getInstanceDataHandler.bind(null, mySql));
  app.post(URL_PREFIX, postInstanceDataHandler.bind(null, mySql));
}

function isTriggered(expression: string, instanceData: Object): boolean {
  const assignments = Object.entries(instanceData).map(
    ([key, value]) => `const ${key} = ${String(value)};`
  );
  const code = assignments.join(' ') + ' ' + expression;
  try {
    // eslint-disable-next-line no-eval
    return eval(code);
  } catch (e) {
    // If the expression references properties that are not set,
    // a ReferenceError will thrown.
    // For now we assume the alert is not triggered.
    if (e instanceof ReferenceError) return false;
    throw e;
  }
}

async function postInstanceDataHandler(
  connection: MySqlConnection,
  req: express$Request,
  res: express$Response
): Promise<void> {
  mySql = connection;

  const instanceId = Number(req.params.instanceId);
  const data = req.body;

  // Get rid of the old data for this instance.
  await deleteInstanceData(instanceId);

  // Save the new data for this instance.
  await saveInstanceData(instanceId, data);

  await deleteDynamicAlerts(instanceId);

  // Get all the alert types defined for the type of this instance.
  const typeId = await getInstanceTypeId(instanceId);
  const alertTypes = await getAlertTypes(typeId);

  // Determine which alerts are triggered by the new data.
  const triggered = alertTypes.filter(alertType =>
    isTriggered(alertType.expression, data)
  );

  // Create new alerts that were triggered.
  const alerts = await createAlerts(instanceId, triggered);

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

module.exports = {
  instanceService,
  getInstanceDataHandler,
  postInstanceDataHandler
};
