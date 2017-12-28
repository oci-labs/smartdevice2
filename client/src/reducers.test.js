// @flow

import {cloneDeep} from 'lodash/lang';
import {upperFirst} from 'lodash/string';
import {reducer, reduxSetup} from 'redux-easy';

import initialState from './initial-state';
import './reducers';

import type {AddNodePayloadType, StateType, TreeNodeType} from './types';

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
    const state: StateType = initialState;
    const root: TreeNodeType = {
      children: [],
      expanded: true,
      name: 'typeRootNode'
    };

    const name = 'new node name';
    const payload: AddNodePayloadType = {name, parent: root};
    const action = {type: 'addNode', payload};
    const newState = reducer(state, action);
    const {typeRootNode} = newState;
    expect(typeRootNode.children.length).toBe(1);
    expect(typeRootNode.children[0]).toEqual({
      children: [],
      expanded: true,
      name,
      parent: root
    });
  });

  test('addNode 2 levels deep', () => {
    const state: StateType = initialState;
    const rootName = 'typeRootNode';
    const root: TreeNodeType = {
      children: [],
      expanded: true,
      name: rootName
    };

    const parentName = 'parent node';
    const parent: TreeNodeType = {
      children: [],
      expanded: true,
      name: parentName,
      parent: root
    };

    root.children.push(parent);

    const childName = 'child node';
    const payload: AddNodePayloadType = {name: childName, parent};
    const action = {type: 'addNode', payload};
    const newState = reducer(state, action);

    const {typeRootNode} = newState;
    expect(typeRootNode.name).toBe(rootName);
    expect(typeRootNode.children.length).toBe(1);
    let [child] = typeRootNode.children;
    expect(child.name).toBe(parentName);
    [child] = child.children;
    expect(child.name).toBe(childName);
  });

  test('deleteNode 1 level deep', () => {
    const rootNode: TreeNodeType = {
      children: [],
      expanded: true,
      name: 'typeRootNode'
    };

    const name = 'new node name';
    const child: TreeNodeType = {
      children: [],
      expanded: true,
      name,
      parent: rootNode
    };

    rootNode.children.push(child);

    const state: StateType = initialState;
    state.typeRootNode = rootNode;

    const action = {type: 'deleteNode', payload: child};
    const newState = reducer(state, action);
    const {typeRootNode} = newState;
    expect(typeRootNode.children.length).toBe(0);
  });

  test('deleteNode 2 levels deep', () => {
    const root: TreeNodeType = {
      children: [],
      expanded: true,
      name: 'typeRootNode'
    };

    const parentName = 'parent node';
    const parent: TreeNodeType = {
      children: [],
      expanded: true,
      name: parentName,
      parent: root
    };

    const childName = 'child node';
    const child: TreeNodeType = {
      children: [],
      expanded: true,
      name: childName,
      parent
    };

    parent.children.push(child);
    root.children.push(parent);

    const state: StateType = initialState;
    state.typeRootNode = root;

    const action = {type: 'deleteNode', payload: child};
    const newState = reducer(state, action);
    const {typeRootNode} = newState;
    expect(typeRootNode.children.length).toBe(1);
    const [node] = typeRootNode.children;
    expect(node.name).toBe(parentName);
    expect(node.children.length).toBe(0);
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
