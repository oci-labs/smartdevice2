// @flow

import type {StateType} from './types';

const state: StateType = {
  alerts: [],
  enumMap: {},
  errors: new Set(),
  instanceData: {},
  instanceNodeMap: {},
  instanceRootId: 0,
  messageServerMap: {},
  typeNodeMap: {},
  typeRootId: 0,
  ui: {
    editedName: '',
    editingNode: null,
    instanceName: '',
    jsonPath: '',
    modal: {
      message: '',
      open: false,
      title: ''
    },
    newAlertExpression: '',
    newAlertName: '',
    newAlertSticky: false,
    newEnumMemberName: '',
    newEnumMemberValue: 0,
    newEnumName: '',
    newPropName: '',
    newPropType: 'number',
    newServerHost: '',
    newServerPort: 1883,
    selectedChildNodeId: 0,
    selectedEnumId: -1, // 0 is a valid id
    selectedInstanceNodeId: 0,
    selectedTypeNodeId: 0,
    // Need to start with treeType set to "type"
    // to force loading of typeNodeMap in Redux.
    treeType: 'type',
    typeAlerts: [],
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
