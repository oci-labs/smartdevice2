// @flow

import type {StateType} from './types';

const state: StateType = {
  errors: new Set(),
  instanceNodeMap: {},
  typeNodeMap: {},
  ui: {
    editedName: '',
    editingNode: null,
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

export default state;
