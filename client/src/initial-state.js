// @flow

import type {StateType} from './types';

const initialState: StateType = {
  errors: new Set(),
  instanceRootNode: {
    children: [],
    name: 'instanceRootNode'
  },
  newInstanceName: '',
  newTypeName: '',
  typeRootNode: {
    children: [],
    name: 'typeRootNode'
  },
  ui: {
    editedName: '',
    editingNode: null,
    modal: {
      message: '',
      open: false,
      title: ''
    }
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

export default initialState;
