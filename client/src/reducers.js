// @flow

import {addReducer} from 'redux-easy';

import {
  addNode,
  deleteNode,
  editNode,
  getFirstPathPart,
  type TreeNodeType
} from './util/tree-util';

import type {
  ModalType,
  StateType
} from './types';

function getRootNode(state: StateType, node: TreeNodeType): ?TreeNodeType {
  const {path} = node;
  if (!path) throw new Error('node must have path');
  const rootName = getFirstPathPart(path);
  return state[rootName];
}

function setTopProp(state: StateType, prop: string, value: mixed): StateType {
  return {...state, [prop]: value};
}

function setUiProp(state: StateType, prop: string, value: mixed): StateType {
  const {ui} = state;
  return {...state, ui: {...ui, [prop]: value}};
}

function setUserProp(
  state: StateType,
  prop: string,
  value: number | string
): StateType {
  const {user} = state;
  return {...state, user: {...user, [prop]: value}};
}

addReducer(
  'addNode',
  (state: StateType, node: TreeNodeType): StateType => {
    const {name, path = ''} = node;
    const rootName = getFirstPathPart(path);
    const rootNode = state[rootName];
    if (!rootNode) throw new Error(`no root node found at "${path}"`);

    const [newRootNode] = addNode(rootNode, path, name);
    return {...state, [getFirstPathPart(path)]: newRootNode};
  }
);

addReducer(
  'deleteNode',
  (state: StateType, targetNode: TreeNodeType): StateType => {
    const rootNode = getRootNode(state, targetNode);
    const {path = 'none'} = targetNode;
    if (!rootNode) throw new Error(`no root node found at "${path}"`);

    const newRootNode = deleteNode(rootNode, targetNode);
    return {...state, [getFirstPathPart(path)]: newRootNode};
  }
);

addReducer('editNode', (state: StateType, name: string): StateType => {
  const node = state.ui.editNode;
  if (!node) throw new Error('no node to edit');
  const {path} = node;
  if (!path) throw new Error('node must have path');

  const rootNode = getRootNode(state, node);
  if (!rootNode) throw new Error('root node not found');

  const newRootNode = editNode(rootNode, node, name);
  const rootName = getFirstPathPart(path);
  return {...state, [rootName]: newRootNode};
});

addReducer('setConfirmEmail', (state: StateType, value: string): StateType =>
  setUserProp(state, 'confirmEmail', value)
);

addReducer('setConfirmPassword', (state: StateType, value: string): StateType =>
  setUserProp(state, 'confirmPassword', value)
);

addReducer('setEmail', (state: StateType, value: string): StateType =>
  setUserProp(state, 'email', value)
);

addReducer('setFirstName', (state: StateType, value: string): StateType =>
  setUserProp(state, 'firstName', value)
);

addReducer('setLastName', (state: StateType, value: string): StateType =>
  setUserProp(state, 'lastName', value)
);

addReducer('setModal', (state: StateType, modal: ModalType) =>
  setUiProp(state, 'modal', modal)
);

addReducer('setNewInstanceName', (state: StateType, value: string): StateType =>
  setTopProp(state, 'newInstanceName', value)
);

addReducer('setNewTypeName', (state: StateType, value: string): StateType =>
  setTopProp(state, 'newTypeName', value)
);

addReducer('setPassword', (state: StateType, value: string): StateType =>
  setUserProp(state, 'password', value)
);

addReducer('setPhone', (state: StateType, value: string): StateType =>
  setUserProp(state, 'phone', value)
);

addReducer(
  'toggleEditNode',
  (state: StateType, node: TreeNodeType): StateType => {
    const value = node === state.ui.editNode ? null : node;
    return setUiProp(state, 'editNode', value);
  });
