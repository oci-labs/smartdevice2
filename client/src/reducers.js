// @flow

import upperFirst from 'lodash/upperFirst';
import {addReducer} from 'redux-easy';

import {showModal} from './share/sd-modal';

import type {
  AddNodePayloadType,
  AlertType,
  AlertTypeType,
  ChangeType,
  ModalType,
  NewNodeNamePayloadType,
  NodeMapType,
  NodePayloadType,
  NodeType,
  PropertyType,
  SetNodesPayloadType,
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
  'addNode',
  (state: StateType, payload: AddNodePayloadType): StateType => {
    const {id, kind, name, parentId, typeId} = payload;
    const nodeMap = state[kind + 'NodeMap'];

    if (!validNewName(nodeMap, parentId, name)) return state;

    // nodeMap is immutable, so make a copy that can be modified.
    const newNodeMap = {...nodeMap};

    // Create the new node.
    const newNode: NodeType = {
      id,
      children: [],
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

addReducer('deleteAlert', (state: StateType, alertId: number) => {
  const {alerts} = state;
  const newAlerts = alerts.filter(alert => alert.id !== alertId);
  return setTopProp(state, 'alerts', newAlerts);
});

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

addReducer('setAlerts', (state: StateType, alerts: AlertType[]) =>
  setTopProp(state, 'alerts', alerts)
);

addReducer('setInstanceData', (state: StateType, data: Object) =>
  setTopProp(state, 'instanceData', data)
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
    const newSelectedId = nodeId !== oldSelectedId ? nodeId : 0;
    const newState = setUiProp(state, 'selectedInstanceNodeId', newSelectedId);
    return setUiProp(newState, prop, newSelectedId);
  }
);

addReducer(
  'setSelectedNode',
  (state: StateType, payload: NodePayloadType): StateType => {
    const {kind, node} = payload;
    const prop = `selected${upperFirst(kind)}NodeId`;

    const oldSelectedId = state.ui[prop];
    const newSelectedId = node && node.id !== oldSelectedId ? node.id : 0;
    return setUiProp(state, prop, newSelectedId);
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

addReducer('setNewAlertExpression', (state: StateType, value: string) =>
  setUiProp(state, 'newAlertExpression', value)
);

addReducer('setNewAlertName', (state: StateType, value: string) =>
  setUiProp(state, 'newAlertName', value)
);

addReducer('setNewAlertSticky', (state: StateType, value: boolean) =>
  setUiProp(state, 'newAlertSticky', value)
);

addReducer(
  'setNewNodeName',
  (state: StateType, payload: NewNodeNamePayloadType): StateType => {
    const {kind, name} = payload;
    return setUiProp(state, kind + 'Name', name);
  }
);

addReducer('setNewPropName', (state: StateType, value: string) =>
  setUiProp(state, 'newPropName', value)
);

addReducer('setNewPropType', (state: StateType, value: string) =>
  setUiProp(state, 'newPropType', value)
);

addReducer('setTreeType', (state: StateType, value: string): StateType =>
  setUiProp(state, 'treeType', value)
);

addReducer('setTypeAlerts', (state: StateType, typeAlerts: AlertTypeType[]) =>
  setUiProp(state, 'typeAlerts', typeAlerts)
);

addReducer('setTypeName', (state: StateType, value: string): StateType =>
  setUiProp(state, 'typeName', value)
);

addReducer('setTypeProps', (state: StateType, typeProps: PropertyType[]) =>
  setUiProp(state, 'typeProps', typeProps)
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
