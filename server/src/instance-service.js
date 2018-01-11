// @flow

const sortBy = require('lodash/sortBy');
const MySqlConnection = require('mysql-easier');

const {errorHandler} = require('./util/error-util');

import type {AlertType, AlertTypeType} from './types';

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

function getAlertTypes(typeId: number): Promise<AlertTypeType[]> {
  const sql = 'select * from alert_type where typeId=?';
  return mySql.query(sql, typeId);
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

async function getInstanceTypeId(instanceId: number): Promise<number> {
  const sql = 'select typeId from instance where id=?';
  const rows = await mySql.query(sql, instanceId);
  const [{typeId}] = rows;
  return Number(typeId);
}

function instanceService(
  app: express$Application,
  connection: MySqlConnection
): void {
  mySql = connection;

  const URL_PREFIX = '/instances/:instanceId/data';
  app.get(URL_PREFIX, getInstanceDataHandler);
  app.post(URL_PREFIX, postInstanceDataHandler);
}

function isTriggered(expression: string, instanceData: Object): boolean {
  const assignments = Object.entries(instanceData).map(
    ([key, value]) => `const ${key} = ${String(value)};`
  );
  const code = assignments.join(' ') + ' ' + expression;
  try {
    //TODO: Check for dangerous code.
    // eslint-disable-next-line no-eval
    const triggered = eval(code);
    if (triggered) {
      console.log('instance-service.js isTriggered: code =', code);
    }
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

  await deleteDynamicAlerts(instanceId);

  // Get all the alert types defined for the type of this instance.
  const typeId = await getInstanceTypeId(instanceId);
  const alertTypes = await getAlertTypes(typeId);

  // Determine which alerts are triggered by the new data.
  const triggered = alertTypes.filter(alertType =>
    isTriggered(alertType.expression, data)
  );

  // Create new alerts that were triggered.
  await createAlerts(instanceId, triggered);

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

module.exports = {
  instanceService,
  getInstanceDataHandler,
  postInstanceDataHandler
};
