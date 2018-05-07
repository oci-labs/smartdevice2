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
  mqttConnectionAttempts: 0,
  trainControl: {
    trainAlive: false,
    controlled: {
      billboardText: '',
      idleCalibration: 0,
      light: 0,
      lightCalibration: 0,
      lightOverride: 0,
      lightPower: false,
      power: 0
    },
    defaults: {
      billboardText: '',
      idleCalibration: 30,
      light: 0,
      lightCalibration: 256 / 2,
      lightOverride: 2,
      lightPower: false,
      power: 0
    },
    detected: {
      billboardText: '',
      idleCalibration: 0,
      light: 0,
      lightCalibration: 0,
      lightOverride: 0,
      lightPower: false,
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
    newAlertPriority: 0,
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
    showUserDropdown: false,
    // Need to start with treeType set to "type"
    // to force loading of typeNodeMap in Redux.
    treeType: 'type',
    typeAlerts: [],
    typeName: '',
    typeProps: [],
    view: 'Types'
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
