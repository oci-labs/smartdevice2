// @flow

import {upperFirst} from 'lodash/string';
import {addReducer} from 'redux-easy';

import type {
  AddNodePayloadType,
  ModalType,
  NewNodeNamePayloadType,
  NodeMapType,
  NodePayloadType,
  NodeType,
  SetNodesPayloadType,
  StateType
} from './types';

/*
function setTopProp(state: StateType, prop: string, value: mixed): StateType {
  return {...state, [prop]: value};
}
*/

function setUiProp(state: StateType, prop: string, value: mixed): StateType {
  const {ui} = state;
  return {...state, ui: {...ui, [prop]: value}};
}

function setUserProp(
  state: StateType,
  prop: string,
  value: number | number[] | string
): StateType {
  const {user} = state;
  return {...state, user: {...user, [prop]: value}};
}

function validateNewName(nodeMap: NodeMapType, parentId: number, name: string) {
  if (!parentId) return; // don't need to do anything for root nodes

  if (!name) throw new Error('new nodes must have a name');

  const parentNode = nodeMap[parentId];
  if (!parentNode) return;

  const {children} = parentNode;
  if (children.find(id => nodeMap[id].name === name)) {
    throw new Error(`duplicate child name "${name}"`);
  }
}

addReducer(
  'addNode',
  (state: StateType, payload: AddNodePayloadType): StateType => {
    const {id, kind, name, parentId} = payload;
    const nodeMap = state[kind + 'NodeMap'];

    validateNewName(nodeMap, parentId, name);

    // nodeMap is immutable, so make a copy that can be modified.
    const newNodeMap = {...nodeMap};

    // Create the new node.
    const newNode: NodeType = {
      id,
      children: [],
      name,
      parentId
    };

    newNodeMap[id] = newNode;

    if (parentId) {
      const parentNode = nodeMap[parentId];

      // parentNode is immutable, so make a copy that can be modified.
      const newParentNode = {
        ...parentNode,
        children: [...parentNode.children],
        expanded: true
      };

      newNodeMap[parentId] = newParentNode;
      newParentNode.children.push(id);
    }

    return {...state, [kind + 'NodeMap']: newNodeMap};
  }
);

addReducer(
  'deleteNode',
  (state: StateType, payload: NodePayloadType): StateType => {
    const {kind, node} = payload;
    const {id, parentId} = node;
    const nodeMap = state[kind + 'NodeMap'];

    // nodeMap is immutable, so make a copy that can be modified.
    const newNodeMap = {...nodeMap};

    delete newNodeMap[id];

    if (parentId) {
      const parentNode = nodeMap[parentId];
      // parentNode is immutable, so make a copy that can be modified.
      const {children} = parentNode;
      const newChildren = children.filter(childId => childId !== id);
      const newParentNode = {...parentNode, children: newChildren};
      newNodeMap[parentId] = newParentNode;
    }

    return {...state, [kind + 'NodeMap']: newNodeMap};
  }
);

addReducer('editNode', (state: StateType, value: string): StateType =>
  setUiProp(state, 'editedName', value)
);

addReducer(
  'saveNode',
  (state: StateType, payload: NodePayloadType): StateType => {
    const {kind, node} = payload;
    const {id, name} = node;

    // Don't allow empty node names.
    if (!name) return state;

    const {ui} = state;
    const nodeMap = state[kind + 'NodeMap'];

    if (name !== node.name) {
      // changing name
      const {parentId} = node;
      validateNewName(nodeMap, parentId, name);
    }

    // nodeMap is immutable, so make a copy that can be modified.
    const newNodeMap = {...nodeMap};
    const newNode = {...node, name};
    newNodeMap[id] = newNode;

    return {
      ...state,
      [kind + 'NodeMap']: newNodeMap,
      ui: {
        ...ui,
        editedName: '',
        editingNode: null
      }
    };
  }
);

addReducer(
  'setSelectedNode',
  (state: StateType, payload: NodePayloadType): StateType => {
    const {kind, node} = payload;
    const prop = `selected${upperFirst(kind)}NodeId`;
    return setUiProp(state, prop, node ? node.id : 0);
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

addReducer(
  'setNewNodeName',
  (state: StateType, payload: NewNodeNamePayloadType): StateType => {
    const {kind, name} = payload;
    return setUiProp(state, kind + 'Name', name);
  }
);

addReducer('setTreeType', (state: StateType, value: string): StateType =>
  setUiProp(state, 'treeType', value)
);

addReducer('setNodes', (state: StateType, payload: SetNodesPayloadType) => {
  const {kind, nodes} = payload;

  const nodeMap = nodes.reduce((map, node) => {
    const {id} = node;
    node.children = nodes.filter(n => n.parentId === id).map(n => n.id);
    map[id] = node;
    return map;
  }, {});

  return {...state, [kind + 'NodeMap']: nodeMap};
});

addReducer('setPassword', (state: StateType, value: string): StateType =>
  setUserProp(state, 'password', value)
);

addReducer('setPhone', (state: StateType, value: string): StateType =>
  setUserProp(state, 'phone', value)
);

addReducer('toggleEditNode', (state: StateType, node: NodeType): StateType => {
  const value = node === state.ui.editingNode ? 0 : node;
  if (value) state = setUiProp(state, 'editedName', node.name);
  return setUiProp(state, 'editingNode', value);
});

addReducer(
  'toggleExpandNode',
  (state: StateType, payload: NodePayloadType): StateType => {
    const {kind, node} = payload;
    const nodeMap = state[kind + 'NodeMap'];

    // nodeMap is immutable, so make a copy that can be modified.
    const newNodeMap = {...nodeMap};
    const newNode = {...node, expanded: !node.expanded};
    newNodeMap[node.id] = newNode;

    return {...state, [kind + 'NodeMap']: newNodeMap};
  }
);

addReducer(
  'toggleSubscribeNode',
  (state: StateType, node: NodeType): StateType => {
    const {subscriptions} = state.user;
    const {id} = node;
    const newSubscriptions = subscriptions.includes(id)
      ? subscriptions.filter(i => i !== id)
      : [...subscriptions, id];

    return setUserProp(state, 'subscriptions', newSubscriptions);
  }
);
