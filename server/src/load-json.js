// @flow
/* eslint-disable no-await-in-loop */

import fs from 'fs';
import got from 'got';
import jsonValidator from 'json-dup-key-validator';

import {mySql} from './database';
import {getEnums} from './enum-service';
import {BUILTIN_TYPES, type EnumType} from './types';

const URL_PREFIX = 'http://localhost:3001/';

const enumNames = [];

function deleteAll(urlSuffix) {
  const url = URL_PREFIX + urlSuffix;
  return got.delete(url);
}

async function getEnumId(enumName): Promise<number> {
  /*
  const url = URL_PREFIX + 'enums';
  const {body} = await got.get(url);
  const enums = JSON.parse(body);
  */
  const enums: EnumType[] = await getEnums();
  const anEnum = enums.find(anEnum => anEnum.name === enumName);
  return anEnum ? anEnum.id : 0;
}

async function getTypeId(typeName) {
  const url = URL_PREFIX + 'type';
  const {body} = await got.get(url);
  const types = JSON.parse(body);
  const type = types.find(type => type.name === typeName);
  return type ? type.id : 0;
}

async function loadEnum(name, valueMap) {
  const res = await post('enum', {name});
  const enumId = res.body;

  enumNames.push(name);

  const valueNames = Object.keys(valueMap);
  const promises = valueNames.map(name => {
    const value = Number(valueMap[name]);
    return post('enum_member', {enumId, name, value});
  });
  await Promise.all(promises);

  console.log('loaded enum', name);
}

async function loadInstance(parentId, name, typeDescriptor) {
  if (typeof typeDescriptor === 'string') {
    const typeId = await getTypeId(typeDescriptor);
    await post('instance', {name, parentId, typeId});
  } else if (typeof typeDescriptor === 'object') {
    const {children, type} = typeDescriptor;
    const typeId = await getTypeId(type);
    const {body: id} = await post('instance', {name, parentId, typeId});

    const childNames = Object.keys(children);
    for (const name of childNames) {
      await loadInstance(id, name, children[name]);
    }
    console.log('loaded instance', name);
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

  const res = await post('type', {name, parentId});
  const typeId = res.body;

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

  console.log('loaded type', name);
}

function post(urlSuffix, body) {
  const url = URL_PREFIX + urlSuffix;
  const options = {body, json: true};
  return got.post(url, options);
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
  const {body: instanceRootId} = await post('instance', {name: 'root'});

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
  const {body: typeRootId} = await post('type', {name: 'root'});

  const typeNames = Object.keys(types);
  for (const name of typeNames) {
    await loadType(typeRootId, name, types[name]);
  }
}

async function processFile(jsonPath) {
  console.log('loading', jsonPath);
  const json = fs.readFileSync(jsonPath, {encoding: 'utf8'});
  try {
    // Check for duplicate keys.
    jsonValidator.parse(json);

    const {enums, instances, types} = JSON.parse(json);

    await processEnums(enums);
    await processTypes(types);
    await processInstances(instances);
    console.log('finished');
    mySql.disconnect(); // allows process to exit
  } catch (e) {
    console.error(e.message);
  }
}

function validKind(kind) {
  return BUILTIN_TYPES.includes(kind) ||
    enumNames.includes(kind);
}

const [, , jsonPath] = process.argv;
processFile(jsonPath);
