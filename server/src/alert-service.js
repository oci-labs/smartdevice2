// @flow

import {getDbConnection} from './database';
import {errorHandler} from './util/error-util';

import type {AlertType} from './types';

let mySql;

function alertService(app: express$Application): void {
  mySql = getDbConnection();
  const URL_PREFIX = '/alerts';

  app.get(URL_PREFIX, getAllHandler);
  app.get(URL_PREFIX + '/:instanaceId', getByInstanceHandler);
}

async function getAllAlerts(): Promise<AlertType[]> {
  const sql =
    'select a.id, a.instanceId, t.name, t.sticky, a.timestamp ' +
    'from alert a, alert_type t ' +
    'where a.alertTypeId = t.id';
  const alerts = await mySql.query(sql);
  return ((alerts: any): AlertType[]);
}

async function getAllHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  try {
    const alerts = await getAllAlerts();
    res.send(alerts);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function getByInstanceHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  const instanceId = Number(req.params.instanceId);
  try {
    const alerts = await getInstanceAlerts(instanceId, true);
    res.send(alerts);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

async function getChildInstanceIds(instanceId: number): Promise<number[]> {
  const sql = 'select id from instance where parentId=?';
  const rows = await mySql.query(sql, instanceId);
  return rows.map(row => row.id);
}

async function getInstanceAlerts(
  instanceId: number,
  includeDescendants: boolean
): Promise<AlertType[]> {
  const sql =
    'select a.id, a.instanceId, t.name, t.sticky, a.timestamp ' +
    'from alert a, alert_type t ' +
    'where instanceId = ? and a.alertTypeId = t.id';
  const alerts = await mySql.query(sql, instanceId);

  if (includeDescendants) {
    const childIds = await getChildInstanceIds(instanceId);

    const promises = childIds.map(childId =>
      getInstanceAlerts(childId, true));
    const results = await Promise.all(promises);
    for (const childAlerts of results) {
      alerts.push(...childAlerts);
    }
  }

  return ((alerts: any): AlertType[]);
}

module.exports = {
  alertService,
  getByInstanceHandler
};
