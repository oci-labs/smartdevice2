// @flow

import {cloneDeep} from 'lodash/lang';
import {upperFirst} from 'lodash/string';
import {reducer, reduxSetup} from 'redux-easy';

import initialState from './initial-state';
import './reducers';

import type {AddNodePayloadType} from './types';

describe('reducer', () => {
  let state;

  beforeEach(() => {
    state = cloneDeep(initialState);
    reduxSetup({initialState: state});
  });

  /*
  function testSetTopProp(prop: string, value: mixed) {
    const action = {type: 'set' + upperFirst(prop), payload: value};
    state = reducer(state, action);
    expect(state[prop]).toEqual(value);
  }
  */

  function testSetUiProp(prop: string) {
    const type = 'set' + upperFirst(prop);
    const payload = true;
    const action = {type, payload};
    state = reducer(state, action);
    expect(state.ui[prop]).toBe(payload);
  }

  function testSetUserProp(prop: string) {
    const type = 'set' + upperFirst(prop);
    const payload = 'some value';
    const action = {type, payload};
    state = reducer(state, action);
    expect(state.user[prop]).toBe(payload);
  }

  test('addNode 1 level deep', () => {
    // Add a root node.
    let payload: AddNodePayloadType = {name: '', parentId: 0};
    let action = {type: 'addNode', payload};
    let newState = reducer(state, action);
    const parentId = newState.lastNodeId;

    // Add a child node to root node.
    const name = 'new node';
    payload = {name, parentId};
    action = {type: 'addNode', payload};
    newState = reducer(newState, action);
    const {lastNodeId: childId, nodeMap} = newState;
    const childNode = nodeMap[childId];
    expect(childNode.name).toBe(name);
    expect(childNode.parentId).toBe(parentId);
    expect(childNode.children.length).toBe(0);

    const parentNode = nodeMap[parentId];
    expect(parentNode.children).toEqual([childId]);
  });

  test('addNode 2 levels deep', () => {
    // Add a root node.
    let payload: AddNodePayloadType = {name: '', parentId: 0};
    let action = {type: 'addNode', payload};
    let newState = reducer(state, action);
    let parentId = newState.lastNodeId;

    // Add a parent node.
    payload = {name: 'some parent', parentId};
    action = {type: 'addNode', payload};
    newState = reducer(newState, action);
    parentId = newState.lastNodeId;

    // Add a child node.
    const childName = 'child node';
    payload = {name: childName, parentId};
    action = {type: 'addNode', payload};
    newState = reducer(newState, action);

    const {lastNodeId: childId, nodeMap} = newState;
    const childNode = nodeMap[childId];
    expect(childNode.id).toBe(childId);
    expect(childNode.name).toBe(childName);
    expect(childNode.parentId).toBe(parentId);
    expect(childNode.children.length).toBe(0);

    const parentNode = nodeMap[parentId];
    expect(parentNode.children).toEqual([childId]);
  });

  test('deleteNode 1 level deep', () => {
    // Add a node.
    const name = 'new node';
    const payload: AddNodePayloadType = {name, parentId: 0};
    let action = {type: 'addNode', payload};
    let newState = reducer(state, action);
    const {lastNodeId: nodeId, nodeMap} = newState;
    const node = nodeMap[nodeId];
    expect(node).toBeDefined();

    // Delete the node that was added.
    action = {type: 'deleteNode', payload: node};
    newState = reducer(state, action);
    expect(newState.nodeMap[nodeId]).not.toBeDefined();
  });

  test('deleteNode 2 levels deep', () => {
    // Add a root node.
    let payload: AddNodePayloadType = {name: '', parentId: 0};
    let action = {type: 'addNode', payload};
    let newState = reducer(state, action);
    const parentId = newState.lastNodeId;

    // Add a child node to root node.
    const name = 'new node';
    payload = {name, parentId};
    action = {type: 'addNode', payload};
    newState = reducer(newState, action);
    const {lastNodeId: nodeId, nodeMap} = newState;
    const node = nodeMap[nodeId];

    // Delete the child node that was added.
    action = {type: 'deleteNode', payload: node};
    newState = reducer(newState, action);
    expect(newState.nodeMap[nodeId]).not.toBeDefined();
  });

  test('setConfirmEmail', () => testSetUserProp('confirmEmail'));
  test('setConfirmPassword', () => testSetUserProp('confirmPassword'));
  test('setEmail', () => testSetUserProp('email'));
  test('setFirstName', () => testSetUserProp('firstName'));
  test('setLastName', () => testSetUserProp('lastName'));
  test('setPassword', () => testSetUserProp('password'));
  test('setPhone', () => testSetUserProp('phone'));

  test('setModal', () => testSetUiProp('modal'));
});
