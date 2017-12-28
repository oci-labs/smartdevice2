// @flow

import {addReducer} from 'redux-easy';

import {cloneTree, getFirstPathPart, getNodesExcept} from './util/tree-util';

//import type {ModalType, StateType, TreeBuilderType, UserType} from './types';
import type {
  AddNodePayloadType,
  ModalType,
  StateType,
  TreeNodeType
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
  (state: StateType, payload: AddNodePayloadType): StateType => {
    const {name, parentPath} = payload;
    if (!parentPath) throw new Error('addNode requires parentPath');

    const [newRoot, node] = cloneTree(state, parentPath);

    const newNode: TreeNodeType = {
      children: [],
      expanded: true,
      name,
      parentPath
    };
    node.children = node.children.concat(newNode);
    return {...state, [getFirstPathPart(parentPath)]: newRoot};
  }
);

addReducer(
  'deleteNode',
  (state: StateType, targetNode: TreeNodeType): StateType => {
    const {parentPath} = targetNode;
    if (!parentPath) {
      throw new Error('targetNode must have parentPath');
    }

    const [newRoot, node] = cloneTree(state, parentPath);
    node.children = getNodesExcept(node.children, targetNode.name);
    return {...state, [getFirstPathPart(parentPath)]: newRoot};
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
