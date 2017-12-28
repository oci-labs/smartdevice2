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

  function testSetTopProp(prop: string, value: mixed) {
    const action = {type: 'set' + upperFirst(prop), payload: value};
    state = reducer(state, action);
    expect(state[prop]).toEqual(value);
  }

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
    const rootName = state.typeRootNode.name;

    const name = 'new node';
    const payload: AddNodePayloadType = {name, path: rootName};
    const action = {type: 'addNode', payload};
    const newState = reducer(state, action);
    const {typeRootNode} = newState;
    expect(typeRootNode.children.length).toBe(1);
    expect(typeRootNode.children[0]).toEqual({
      children: [],
      name,
      path: rootName
    });
  });

  test('addNode 2 levels deep', () => {
    const rootName = state.typeRootNode.name;

    const parentName = 'parent node';
    let path = rootName;
    let payload: AddNodePayloadType = {name: parentName, path};
    let action = {type: 'addNode', payload};
    let newState = reducer(state, action);

    const childName = 'child node';
    path = `${rootName}/${parentName}`;
    payload = {name: childName, path};
    action = {type: 'addNode', payload};
    newState = reducer(newState, action);

    const {typeRootNode} = newState;
    expect(typeRootNode.name).toBe(rootName);
    expect(typeRootNode.children.length).toBe(1);
    let [child] = typeRootNode.children;
    expect(child.name).toBe(parentName);
    [child] = child.children;
    expect(child.name).toBe(childName);
  });

  test('addNode missing path', () => {
    const payload: AddNodePayloadType = {name: 'some name', path: ''};
    const action = {type: 'addNode', payload};
    expect(() => reducer(state, action)).toThrow('path is required');
  });

  test('deleteNode 1 level deep', () => {
    const rootName = state.typeRootNode.name;

    // Add a node.
    const name = 'new node';
    const path = rootName;
    const payload: AddNodePayloadType = {name, path};
    let action = {type: 'addNode', payload};
    let newState = reducer(state, action);

    // Delete the node that was added.
    const [child] = newState[rootName].children;
    action = {type: 'deleteNode', payload: child};
    newState = reducer(state, action);

    expect(newState.typeRootNode.children.length).toBe(0);
  });

  test('deleteNode 2 levels deep', () => {
    const rootName = state.typeRootNode.name;

    // Add a node.
    const parentName = 'parent node';
    let path = rootName;
    let payload: AddNodePayloadType = {name: parentName, path};
    let action = {type: 'addNode', payload};
    let newState = reducer(state, action);

    // Add a child to the previously added node.
    const childName = 'child node';
    path = `${rootName}/${parentName}`;
    payload = {name: childName, path};
    action = {type: 'addNode', payload};
    newState = reducer(newState, action);

    // Delete the child node that was added.
    const [parent] = newState[rootName].children;
    const [child] = parent.children;
    action = {type: 'deleteNode', payload: child};
    newState = reducer(newState, action);

    const {typeRootNode} = newState;
    expect(typeRootNode.children.length).toBe(1);
    const [node] = typeRootNode.children;
    expect(node.name).toBe(parentName);
    expect(node.children.length).toBe(0);
  });

  test('deleteNode missing path', () => {
    const rootName = state.typeRootNode.name;

    // Add a node.
    const name = 'new node';
    const path = `${rootName}`;
    const payload: AddNodePayloadType = {name, path};
    let action = {type: 'addNode', payload};
    const newState = reducer(state, action);

    // Delete the node that was added.
    const [child] = newState[rootName].children;
    const childCopy = {...child, path: ''};
    action = {type: 'deleteNode', payload: childCopy};
    expect(() => reducer(state, action)).toThrow('node must have path');
  });

  test('setConfirmEmail', () => testSetUserProp('confirmEmail'));
  test('setConfirmPassword', () => testSetUserProp('confirmPassword'));
  test('setEmail', () => testSetUserProp('email'));
  test('setFirstName', () => testSetUserProp('firstName'));
  test('setLastName', () => testSetUserProp('lastName'));
  test('setPassword', () => testSetUserProp('password'));
  test('setPhone', () => testSetUserProp('phone'));

  test('setModal', () => testSetUiProp('modal'));

  test('setNewInstanceName', () =>
    testSetTopProp('newInstanceName', 'some value'));
  test('setNewTypeName', () => testSetTopProp('newTypeName', 'some value'));
});
