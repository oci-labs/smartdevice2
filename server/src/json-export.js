// @flow
/* eslint-disable no-await-in-loop */

import fs from 'fs';

import {getEnums} from './enum-service';
import {getInstanceChildren, getTopInstances} from './instance-service';
import {getServers} from './message-server-service';
import {errorHandler} from './util/error-util';
import {
  getTopTypes,
  getTypeAlerts,
  getTypeChildren,
  getTypeName,
  getTypeProperties
} from './type-service';
import {values} from './util/flow-util';

async function exportHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  try {
    const json = await exportToJson();
    res.set('Content-Type', 'application/json');
    res.set('Content-Disposition', 'attachment; filename="oe-dev-mgmt.json"');
    res.send(json);
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  }
}

export function exportService(app: express$Application): void {
  app.get('/export', exportHandler);
}

async function exportToFile(filePath: string) {
  const json = await exportToJson();
  fs.writeFileSync(filePath, json);

  // eslint-disable-next-line no-process-exit
  process.exit(0);
}

async function exportToJson() {
  const obj = {};
  await processMessageServers(obj);
  await processEnums(obj);
  await processTypes(obj);
  await processInstances(obj);
  return JSON.stringify(obj, null, 2);
}

async function getInstance(instance: Object) {
  const _children = await getInstanceChildren(instance.id);
  const children = {};
  for (const child of _children) {
    children[child.name] = await getInstance(child);
  }

  const obj = {};
  obj.type = await getTypeName(instance.typeId);
  if (_children.length) obj.children = children;
  return obj;
}

async function getType(type: Object) {
  const _alerts = await getTypeAlerts(type.id);
  const alerts = _alerts.map(a => ({
    name: a.name,
    condition: a.expression,
    sticky: a.sticky
  }));

  const {messageServerId} = type;

  const _properties = await getTypeProperties(type.id);
  const properties = _properties.reduce((map, p) => {
    map[p.name] = p.kind;
    return map;
  }, {});

  const _children = await getTypeChildren(type.id);
  const children = {};
  for (const child of _children) {
    children[child.name] = await getType(child);
  }

  const obj = {};
  if (_alerts.length) obj.alerts = alerts;
  if (_children.length) obj.children = children;
  if (messageServerId) obj.messageServerId = messageServerId;
  if (_properties.length) obj.properties = properties;
  return obj;
}

async function processEnums(obj: Object): Promise<void> {
  const enums = await getEnums();
  obj.enums = enums.reduce((map, anEnum) => {
    const {name, memberMap} = anEnum;
    const members = values(memberMap);
    const newMembers = members.reduce((map, member) => {
      map[member.name] = member.value;
      return map;
    }, {});
    map[name] = newMembers;
    return map;
  }, {});
}

async function processInstances(obj: Object): Promise<void> {
  const parent = {};
  const instances = await getTopInstances();
  for (const instance of instances) {
    const obj = await getInstance(instance);
    parent[instance.name] = obj;
  }

  obj.instances = parent;
}

async function processMessageServers(obj: Object): Promise<void> {
  const servers = await getServers();
  obj.messageServers = servers.map(({id, host, port}) => ({id, host, port}));
}

async function processTypes(obj: Object): Promise<void> {
  const parent = {};
  const types = await getTopTypes();
  for (const type of types) {
    const obj = await getType(type);
    parent[type.name] = obj;
  }

  obj.types = parent;
}

if (require.main === module) {
  const [, , jsonPath] = process.argv;
  exportToFile(jsonPath);
}
