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
  mqttConnected: false,
  trainControl: {
    controlled: {
      billboardText: '',
      idleCalibration: 0,
      light: 0,
      lightCalibration: 0,
      lightOverride: 0,
      power: 0
    },
    defaults: {
      billboardText: '',
      idleCalibration: 30,
      light: 0,
      lightCalibration: 256 / 2,
      lightOverride: 2,
      power: 0
    },
    detected: {
      billboardText: '',
      idleCalibration: 0,
      light: 0,
      lightCalibration: 0,
      lightOverride: 0,
      power: 0
    }
  },
  typeNodeMap: {},
  typeRootId: 0,
  ui: {
    editedName: '',
    editingNode: null,
    instanceName: '',
    jsonPath: '',
    lastUsedMessageServerId: 0,
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
