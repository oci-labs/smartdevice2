// @flow

import {addReducer} from 'redux-easy';

import {
  addNode,
  deleteNode,
  getFirstPathPart,
  type TreeNodeType
} from './util/tree-util';

import type {
  ModalType,
  StateType
} from './types';

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

    const newRootNode = addNode(rootNode, path, name);
    return {...state, [getFirstPathPart(path)]: newRootNode};
  }
);

addReducer(
  'deleteNode',
  (state: StateType, targetNode: TreeNodeType): StateType => {
    const {path} = targetNode;
    if (!path) {
      throw new Error('deleteNode targetNode must have path');
    }
    const rootName = getFirstPathPart(path);
    const rootNode = state[rootName];
    if (!rootNode) throw new Error(`no root node found at "${path}"`);

    const newRootNode = deleteNode(rootNode, targetNode);
    return {...state, [getFirstPathPart(path)]: newRootNode};
  }
);

addReducer(
  'editNode',
  (state: StateType, payload: TreeNodeType): StateType => {
    const {name, path} = payload;
    let newState = setUiProp(state, 'editNodeName', name);
    newState = setUiProp(state, 'editNodePath', path);
    return newState;
  }
);

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
