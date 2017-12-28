// @flow

import {addReducer} from 'redux-easy';

//import type {ModalType, StateType, TreeBuilderType, UserType} from './types';
import type {
  AddNodePayloadType,
  ModalType,
  StateType,
  TreeNodeType
} from './types';

function copyNodesExcept(nodes: TreeNodeType[], except: TreeNodeType) {
  return nodes.filter(node => node.name !== except.name);
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
  (state: StateType, payload: AddNodePayloadType): StateType => {
    const {name, parent} = payload;

    const newNode: TreeNodeType = {
      children: [],
      expanded: true,
      name,
      parent
    };

    // Recreate parent node with new children.
    const newChildren = [...parent.children, newNode];
    let newParent = {...parent, children: newChildren};

    // Walk up the tree.
    while (newParent.parent) {
      const grandparent = newParent.parent;

      // Copy current children except old parent node.
      let children = copyNodesExcept(grandparent.children, newParent);

      // Add new parent node.
      children = [...children, newParent];

      newParent = {...grandparent, children};
    }

    const rootPropertyName = newParent.name;
    return {...state, [rootPropertyName]: newParent};
  }
);

addReducer(
  'deleteNode',
  (state: StateType, node: TreeNodeType): StateType => {
    // Recreate parent node with new children.
    const {parent} = node;
    const newChildren = parent ?
      parent.children.filter(child => child !== node) :
      [];
    let newParent = {...parent, children: newChildren};

    while (newParent.parent) {
      const grandparent = newParent.parent;

      // Copy current children except old parent node.
      let children = copyNodesExcept(grandparent.children, newParent);

      // Add new parent node.
      children = [...children, newParent];

      newParent = {...grandparent, children};
    }

    const rootPropertyName = newParent.name;
    return {...state, [rootPropertyName]: newParent};
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
