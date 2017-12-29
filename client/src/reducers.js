// @flow

import {addReducer} from 'redux-easy';

import {
  PATH_DELIMITER,
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

function updateNames(node: TreeNodeType, position: number, name: string) {
  for (const child of node.children) {
    const {path} = child;
    if (path) {
      const parts = path.split(PATH_DELIMITER);
      parts[position] = name;
      child.path = parts.join(PATH_DELIMITER);
      updateNames(child, position, name);
    }
  }
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

addReducer('editNodeName', (state: StateType, value: string): StateType =>
  setUiProp(state, 'editedName', value));

addReducer('saveNodeName', (state: StateType): StateType => {
  const {ui: {editedName, editingNode}} = state;
  if (!editingNode) throw new Error('no node to edit');

  const rootNode = getRootNode(state, editingNode);
  if (!rootNode) throw new Error('root node not found');

  const {path} = editingNode;
  if (!path) throw new Error('node must have path');

  const [newRootNode, newNode] = editNode(rootNode, editingNode, editedName);

  if (newNode.path) {
    // Change the path of all nodes below the one that was edited
    // to use the new name.
    const position = newNode.path.split(PATH_DELIMITER).length;
    updateNames(newNode, position, editedName);
  }

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
    const value = node === state.ui.editingNode ? null : node;
    if (value) state = setUiProp(state, 'editedName', node.name);
    return setUiProp(state, 'editingNode', value);
  });
