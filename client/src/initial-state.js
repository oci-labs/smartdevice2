// @flow

import type {StateType} from './types';

const state: StateType = {
  allAlerts: [],
  errors: new Set(),
  instanceAlerts: [],
  instanceData: {},
  instanceNodeMap: {},
  typeNodeMap: {},
  ui: {
    editedName: '',
    editingNode: null,
    instanceName: '',
    modal: {
      message: '',
      open: false,
      title: ''
    },
    newAlertExpression: '',
    newAlertName: '',
    newPropName: '',
    newPropType: 'number',
    selectedChildNodeId: 0,
    selectedInstanceNodeId: 0,
    selectedTypeNodeId: 0,
    // Need to start with treeType set to "type"
    // to force loading of typeNodeMap in Redux.
    treeType: 'type',
    typeName: '',
    typeProps: []
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
    subscriptions: [],
    version: 0
  }
};

export default state;
