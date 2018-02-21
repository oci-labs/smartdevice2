// @flow

import upperFirst from 'lodash/upperFirst';
import {addReducer} from 'redux-easy';

import {showModal} from './share/sd-modal';
import {values} from './util/flow-util';

import type {
  AddNodePayloadType,
  ChangeType,
  EnumMemberType,
  NodeMapType,
  NodePayloadType,
  NodeType,
  SetNodesPayloadType,
  StateType,
  TreeType
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
  value: number | number[] | string
): StateType {
  const {user} = state;
  return {...state, user: {...user, [prop]: value}};
}

function validNewName(nodeMap: NodeMapType, parentId: number, name: string) {
  if (!parentId) return; // don't need to do anything for root nodes

  if (!name) throw new Error('new nodes must have a name');

  const parentNode = nodeMap[parentId];
  if (!parentNode) return;

  const {children} = parentNode;
  const inUse = children.find(id => nodeMap[id].name === name);
  if (inUse) {
    showModal({
      title: 'Duplicate Child Name',
      message:
        `The name "${name}" is already in use ` +
        `by a child of "${parentNode.name}".`
    });
  }

  return !inUse;
}

addReducer(
  'addEnumMember',
  (state: StateType, enumMember: EnumMemberType) => {
    const {enumId, id} = enumMember;

    const {enumMap, ui} = state;
    const anEnum = enumMap[enumId];
    if (!anEnum) {
      console.error('invalid enum id', enumId);
      return state;
    }

    const newMemberMap = {...anEnum.memberMap};
    newMemberMap[id] = enumMember;
    const newEnum = {...anEnum, memberMap: newMemberMap};
    const newEnumMap = {...enumMap, [enumId]: newEnum};
    const newUi = {
      ...ui,
      newEnumMemberName: '',
      newEnumMemberValue: ui.newEnumMemberValue + 1
    };
    return {...state, enumMap: newEnumMap, ui: newUi};
  }
);

addReducer(
  'addNode',
  (state: StateType, payload: AddNodePayloadType): StateType => {
    const {id, kind, messageServerId, name, parentId, typeId} = payload;
    const nodeMap = state[kind + 'NodeMap'];

    if (!validNewName(nodeMap, parentId, name)) return state;

    // nodeMap is immutable, so make a copy that can be modified.
    const newNodeMap = {...nodeMap};

    // Create the new node.
    const newNode: NodeType = {
      ...payload,
      id,
      children: [],
      messageServerId,
      name,
      parentId,
      typeId
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

// Clears enough state to cause UI to rerender.
// This is useful after a JSON file import.
addReducer('clear', (state: StateType) => ({
  ...state,
  instanceRootId: 0,
  instanceNodeMap: {},
  typeRootId: 0,
  typeNodeMap: {}
}));

addReducer('deleteAlert', (state: StateType, alertId: number) => {
  const {alerts} = state;
  const newAlerts = alerts.filter(alert => alert.id !== alertId);
  return setTopProp(state, 'alerts', newAlerts);
});

addReducer(
  'deleteEnumMember',
  (state: StateType, enumMember: EnumMemberType) => {
    const {enumId, id} = enumMember;

    const {enumMap} = state;
    const anEnum = enumMap[enumId];
    if (!anEnum) {
      console.error('invalid enum id', enumId);
      return state;
    }

    const newMemberMap = {...anEnum.memberMap};
    delete newMemberMap[id];
    const newEnum = {...anEnum, memberMap: newMemberMap};
    const newEnumMap = {...enumMap, [enumId]: newEnum};
    return {...state, enumMap: newEnumMap};
  }
);

function deleteNodeAndDescendants(nodeMap, id) {
  delete nodeMap[id];
  const nodes = values(nodeMap);
  const children = nodes.filter(node => node.parentId === id);
  children.forEach(child => deleteNodeAndDescendants(nodeMap, child.id));
}

addReducer(
  'deleteNode',
  (state: StateType, payload: NodePayloadType): StateType => {
    const {kind, node} = payload;
    const {id, parentId} = node;
    const nodeMap = state[kind + 'NodeMap'];

    // nodeMap is immutable, so make a copy that can be modified.
    const newNodeMap = {...nodeMap};

    deleteNodeAndDescendants(newNodeMap, id);

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
      if (!validNewName(nodeMap, parentId, name)) return state;
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

addReducer('setInstanceProperty', (state: StateType, change: ChangeType) => {
  const {instanceData, ui} = state;
  const {selectedInstanceNodeId} = ui;
  const {instanceId, property, value} = change;

  if (instanceId !== selectedInstanceNodeId) return state;

  const newInstanceData = {...instanceData, [property]: value};
  return setTopProp(state, 'instanceData', newInstanceData);
});

addReducer(
  'setSelectedChildNodeId',
  (state: StateType, nodeId: number): StateType => {
    const prop = 'selectedChildNodeId';
    const oldSelectedId = state.ui[prop];

    if (nodeId === oldSelectedId) return state;

    const newState = setUiProp(state, 'selectedInstanceNodeId', nodeId);
    return setUiProp(newState, prop, nodeId);
  }
);

addReducer(
  'setSelectedNode',
  (state: StateType, payload: NodePayloadType): StateType => {
    const {kind, node} = payload;
    const prop = `selected${upperFirst(kind)}NodeId`;

    const oldSelectedId = state.ui[prop];

    // Don't change the state if the currently selected node
    // is selected again.
    return node && node.id !== oldSelectedId
      ? setUiProp(state, prop, node.id)
      : state;
  }
);

addReducer('setNodes', (state: StateType, payload: SetNodesPayloadType) => {
  const {kind, nodes = []} = payload;

  const rootNode = nodes.find(node => node.name === 'root');
  const rootId = rootNode ? rootNode.id : 0;

  const nodeMap = nodes.reduce((map, node) => {
    const {id} = node;
    node.children = nodes.filter(n => n.parentId === id).map(n => n.id);
    map[id] = node;
    return map;
  }, {});

  return {
    ...state,
    [kind + 'NodeMap']: nodeMap,
    [kind + 'RootId']: rootId
  };
});

addReducer('toggleEditNode', (state: StateType, node: NodeType): StateType => {
  const value = node === state.ui.editingNode ? 0 : node;
  if (value) state = setUiProp(state, 'editedName', node.name);
  return setUiProp(state, 'editingNode', value);
});

addReducer(
  'toggleExpandNode',
  (state: StateType, payload: NodePayloadType): StateType => {
    const {kind, node} = payload;
    const key = kind + 'NodeMap';
    const nodeMap = state[key];

    // nodeMap is immutable, so make a copy that can be modified.
    const newNodeMap = {...nodeMap};
    const newNode = {...node, expanded: !node.expanded};
    newNodeMap[node.id] = newNode;

    return {...state, [key]: newNodeMap};
  }
);

addReducer('toggleExpandAll', (state: StateType, kind: TreeType): StateType => {
  const key = kind + 'NodeMap';
  const nodeMap = state[key];
  const [firstNode] = values(nodeMap);
  if (!firstNode) return state;

  const expanded = !firstNode.expanded;

  const newNodeMap = {};

  Object.values(nodeMap).forEach(node => {
    const copy = {...node};
    copy.expanded = expanded;
    newNodeMap[copy.id] = copy;
  });

  return {...state, [key]: newNodeMap};
});

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

addReducer(
  'trainReset',
  (state: StateType): StateType => {
    const {trainControl} = state;
    const {defaults} = trainControl;
    return {
      ...state,
      trainControl: {
        ...trainControl,
        controlled: {...defaults},
        detected: {...defaults}
      }
    };
  }
);
