// @flow

import './reducers';
import {reducer} from 'redux-easy';

import type {AddNodePayloadType, StateType} from './types';

let state: StateType = {
  errors: new Set(),
  instanceRootId: 0,
  lastNodeId: 0,
  nodeMap: {},
  typeRootId: 0,
  ui: {
    editedName: '',
    editingNodeId: 0,
    modal: {
      message: '',
      open: false,
      title: ''
    },
    newNodeName: ''
  },
  user: {
    confirmEmail: '',
    confirmPassword: '',
    email: '',
    firstName: '',
    id: 0,
    lastName: '',
    organization: '',
    password: '',
    phone: '',
    role: 'spectator',
    version: 0
  }
};

// Add root node for types.
let payload: AddNodePayloadType = {name: 'type root', parentId: 0};
let action = {type: 'addNode', payload};
state = reducer(state, action);
const typeRootId = state.lastNodeId;

// Add root node for instances.
payload = {name: 'instance root', parentId: 0};
action = {type: 'addNode', payload};
state = reducer(state, action);
const instanceRootId = state.lastNodeId;

export default {...state, instanceRootId, typeRootId};
