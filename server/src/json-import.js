// @flow
/* eslint-disable no-await-in-loop */

import fs from 'fs';
import jsonValidator from 'json-dup-key-validator';

import {getDbConnection} from './database';
import {deleteAll, getAll, post} from './crud-service';
import {getEnums} from './enum-service';
import {clearPathToIdMap} from './instance-service';
import {BUILTIN_TYPES, type EnumType} from './types';
import {sleep} from './util/async-util';
import {errorHandler} from './util/error-util';

const enumNames = [];
const mySql = getDbConnection();

async function getEnumId(enumName): Promise<number> {
  const enums: EnumType[] = await getEnums();
  const anEnum = enums.find(anEnum => anEnum.name === enumName);
  return anEnum ? anEnum.id : 0;
}

async function getTypeId(typeName) {
  const types = await getAll('type');
  const type = types.find(type => type.name === typeName);
  return type ? type.id : 0;
}

async function loadEnum(name, valueMap) {
  const enumId = await post('enum', {name});

  enumNames.push(name);

  const valueNames = Object.keys(valueMap);
  const promises = valueNames.map(name => {
    const value = Number(valueMap[name]);
    return post('enum_member', {enumId, name, value});
  });
  await Promise.all(promises);

  console.info('imported enum', name);
}

async function importHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
  clearPathToIdMap();
  global.importInProgress = true;

  // Wait for current messages to complete processing.
  sleep(2000);

  try {
    await processObject(req.body);
    res.send();
  } catch (e) {
    // istanbul ignore next
    errorHandler(res, e);
  } finally {
    global.importInProgress = false;
  }
}

export function importService(app: express$Application): void {
  app.post('/import', importHandler);
}

async function loadInstance(parentId, name, descriptor) {
  if (typeof descriptor === 'object') {
    const {children = {}, type} = descriptor;
    const typeId = await getTypeId(type);
    const id = await post('instance', {name, parentId, typeId});

    const childNames = Object.keys(children);
    for (const name of childNames) {
      await loadInstance(id, name, children[name]);
    }
    console.info('imported instance', name);
  } else {
    throw new Error('invalid instance type: ' + descriptor);
  }
}

async function loadType(parentId, name, dataMap) {
  const {
    alerts = [],
    children = {},
    messageServerId,
    properties = {}
  } = dataMap;

  const typeId = await post('type', {name, parentId, messageServerId});

  const propertyNames = Object.keys(properties);
  for (const name of propertyNames) {
    const kind = properties[name];
    if (!validKind(kind)) {
      throw new Error(`invalid kind "${kind}"`);
    }

    const data = {typeId, name, kind};
    const enumId = await getEnumId(kind);
    // $FlowFixMe - allow adding enumId
    if (enumId) data.enumId = enumId;
    await post('type_data', data);
  }

  const childNames = Object.keys(children);
  for (const name of childNames) {
    const childType = children[name];
    await loadType(typeId, name, childType);
  }

  for (const alert of alerts) {
    const {name, condition, sticky} = alert;
    const data = {
      typeId,
      name,
      expression: condition,
      sticky
    };
    await post('alert_type', data);
    console.info('imported alert', name);
  }

  console.info('imported type', name);
}

async function processEnums(enums) {
  if (!enums) return;

  // Clear the tables that will be loaded.
  // enum_member is cleared through cascading deletes.
  await deleteAll('enum');

  const enumNames = Object.keys(enums);
  for (const name of enumNames) {
    await loadEnum(name, enums[name]);
  }
}

async function processInstances(instances) {
  if (!instances) return;

  // Clear the tables that will be loaded.
  // instance_data is cleared through cascading deletes.
  await deleteAll('instance');

  // Add instance root node.
  const instanceRootId = await post('instance', {name: 'root'});

  const instanceNames = Object.keys(instances);
  for (const name of instanceNames) {
    await loadInstance(instanceRootId, name, instances[name]);
  }
}

async function processTypes(types) {
  if (!types) return;

  // Clear the tables that will be loaded.
  // type_data is cleared through cascading deletes.
  await deleteAll('type');

  // Add type root node.
  const typeRootId = await post('type', {name: 'root'});

  const typeNames = Object.keys(types);
  for (const name of typeNames) {
    await loadType(typeRootId, name, types[name]);
  }
}

async function processFile(jsonPath) {
  if (!jsonPath) {
    console.error('processFile requires a JSON file path');
    return;
  }

  console.info('importing', jsonPath);
  const json = fs.readFileSync(jsonPath, {encoding: 'utf8'});
  let status = 0;
  try {
    // Check for duplicate keys.
    jsonValidator.parse(json);

    await processObject(JSON.parse(json));
  } catch (e) {
    console.trace(e);
    status = 1;
  } finally {
    mySql.disconnect();

    // eslint-disable-next-line no-process-exit
    process.exit(status);
  }
}

async function processObject(obj: Object) {
  const {enums, instances, messageServers, types} = obj;

  await processMessageServers(messageServers);
  await processEnums(enums);
  await processTypes(types);
  await processInstances(instances);
  console.info('import finished');
}

async function processMessageServers(messageServers) {
  if (!messageServers) return;

  // Clear the tables that will be loaded.
  await deleteAll('type'); // holds foreign keys to message_server
  await deleteAll('message_server');

  for (const messageServer of messageServers) {
    await post('message_server', messageServer);
    console.info('imported message server', messageServer.host);
  }
}

function validKind(kind) {
  return BUILTIN_TYPES.includes(kind) || enumNames.includes(kind);
}

if (require.main === module) {
  const [, , jsonPath] = process.argv;
  processFile(jsonPath);
}
