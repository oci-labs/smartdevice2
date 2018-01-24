// @flow
/* eslint-disable no-await-in-loop */

import fs from 'fs';
import jsonValidator from 'json-dup-key-validator';

import {getDbConnection} from './database';
import {deleteAll, getAll, post} from './crud-service';
import {getEnums} from './enum-service';
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

  console.log('imported enum', name);
}

async function importHandler(
  req: express$Request,
  res: express$Response
): Promise<void> {
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

async function loadInstance(parentId, name, typeDescriptor) {
  if (typeof typeDescriptor === 'string') {
    const typeId = await getTypeId(typeDescriptor);
    await post('instance', {name, parentId, typeId});
  } else if (typeof typeDescriptor === 'object') {
    const {children, type} = typeDescriptor;
    const typeId = await getTypeId(type);
    const id = await post('instance', {name, parentId, typeId});

    const childNames = Object.keys(children);
    for (const name of childNames) {
      await loadInstance(id, name, children[name]);
    }
    console.log('imported instance', name);
  } else {
    throw new Error('invalid instance type: ' + typeDescriptor);
  }
}

async function loadType(parentId, name, valueMap) {
  const keys = Object.keys(valueMap);
  const propertyNames = keys.filter(key => {
    const value = valueMap[key];
    return typeof value === 'string';
  });
  const childNames = keys.filter(key => {
    const value = valueMap[key];
    return typeof value === 'object';
  });

  const typeId = await post('type', {name, parentId});

  for (const name of propertyNames) {
    const kind = valueMap[name];
    if (!validKind(kind)) {
      throw new Error(`invalid kind "${kind}"`);
    }

    const data = {typeId, name, kind};
    const enumId = await getEnumId(kind);
    // $FlowFixMe - allow adding enumId
    if (enumId) data.enumId = enumId;
    await post('type_data', data);
  }

  for (const name of childNames) {
    const childType = valueMap[name];
    await loadType(typeId, name, childType);
  }

  console.log('imported type', name);
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

  console.log('loading', jsonPath);
  const json = fs.readFileSync(jsonPath, {encoding: 'utf8'});
  try {
    // Check for duplicate keys.
    jsonValidator.parse(json);

    await processObject(JSON.parse(json));
  } catch (e) {
    console.error(e.message);
  }
}

async function processObject(obj: Object) {
  const {enums, instances, types} = obj;

  await processEnums(enums);
  await processTypes(types);
  await processInstances(instances);
  console.log('finished');
  mySql.disconnect(); // allows process to exit
}

function validKind(kind) {
  return BUILTIN_TYPES.includes(kind) ||
    enumNames.includes(kind);
}

if (require.main === module) {
  const [, , jsonPath] = process.argv;
  processFile(jsonPath);
}
