// @flow

export type ActionType = {
  type: string,
  payload?: any
};

export type AddNodePayloadType = {
  id: number,
  kind: TreeType,
  messageServerId?: number,
  name: string,
  parentId: number,
  typeId?: number
};

export type AddressType = {
  street: string,
  city: string,
  state: string,
  zip: string
};

export type AlertType = {
  id: number,
  instanceId: number,
  name: string,
  timestamp: Date
};

export type AlertTypeType = {
  name: string,
  expression: string,
  id: number,
  priority: number,
  sticky: boolean,
  typeId: number
};

export type ChangeType = {
  instanceId: number,
  property: string,
  value: PrimitiveType
};

export type ConfirmType = {
  message: string,
  noCb: Function,
  open?: boolean,
  title: string,
  yesCb: Function
};

export type EnumMapType = {[id: number]: EnumType};

export type EnumMemberMapType = {[id: number]: EnumMemberType};

export type EnumMemberType = {
  id: number,
  enumId: number,
  name: string,
  value: number
};

export type EnumType = {
  id: number,
  name: string,
  memberMap: EnumMemberMapType
};

export type HistoryType = {
  location: {
    pathname: string
  },
  push: Function
};

export type InstanceDataType = {
  dataKey: string,
  dataValue: string
};

export type InstanceType = {
  children: InstanceType[],
  name: string,
  parent: InstanceType,
  type: NodeType
};

export type MessageServerMapType = {[id: number]: MessageServerType};

export type MessageServerType = {
  id: number,
  cleanSession?: string,
  clientId?: number,
  host: string,
  keepAlive?: boolean,
  lastWill?: string,
  port: number
};

export type ModalType = {
  error?: boolean,
  message?: string,
  open?: boolean,
  renderFn?: Function,
  title: string
};

export type NodeMapType = {[id: number]: NodeType};

export type NodePayloadType = {
  kind: TreeType,
  node: NodeType
};

export type NodeType = {
  id: number,
  children: number[],
  expanded?: boolean,
  messageServerId?: number,
  name: string,
  parentId: number,
  selected?: boolean,
  typeId?: number // for instance nodes
};

export type PrimitiveType = boolean | number | string;

export type PromptType = {
  buttonText: string,
  label: string,
  message?: string,
  okCb: Function,
  path: string,
  title: string
};

export type PropertyKindType = 'boolean' | 'number' | 'percent' | 'text';

export type PropertyType = {
  enumId: number,
  id: number,
  name: string,
  kind: PropertyKindType
};

export type RoleType = 'admin' | 'service' | 'spectator';

export type SetNodesPayloadType = {
  kind: TreeType,
  nodes: NodeType[]
};

export type StateType = {
  alerts: AlertType[],
  enumMap: EnumMapType,
  errors: Set<string>,
  instanceData: Object,
  instanceNodeMap: NodeMapType,
  instanceRootId: number,
  messageServerMap: MessageServerMapType,
  mqttConnected: boolean,
  mqttConnectionAttempts: number,
  trainControl: TrainControlType,
  typeNodeMap: NodeMapType,
  typeRootId: number,
  ui: UiType,
  user: UserType
};

export type StoreType = {
  getActions(): ActionType[],
  getState(): StateType,
  subscribe: Function
};

export type SystemType = {
  alerts: AlertType[],
  id: string,
  internalIp?: string,
  location: string,
  model: string,
  name: string
};

export type TrainControlType = {
  trainAlive: boolean,
  controlled: TrainValuesType,
  defaults: TrainValuesType,
  detected: TrainValuesType
};

export type TrainValuesType = {
  billboardText: string, // displayed on train
  idleCalibration: number, // range before forward or reverse
  light: number, // measured ambient light
  lightCalibration: number, // range for Auto
  lightOverride: number, // 0=Off, 1=On, 2=Auto
  lightPower: boolean, // are lights on?
  power: number // for engine
};

// These strings must correspond to the name of a database table.
export type TreeType = 'instance' | 'type';

export type UiType = {
  editedName: string, // within type or instance tree
  editingNode: ?NodeType, // within type or instance tree
  instanceName: string,
  jsonPath: string,
  lastUsedMessageServerId: number,
  modal: ModalType,
  newAlertExpression: string,
  newAlertName: string,
  newAlertPriority: number,
  newAlertSticky: boolean,
  newEnumMemberName: string,
  newEnumMemberValue: number,
  newEnumName: string,
  newPropName: string,
  newPropType: string,
  newServerHost: string,
  newServerPort: number,
  selectedChildNodeId: number,
  selectedEnumId: number,
  selectedInstanceNodeId: number,
  selectedTypeNodeId: number,
  showUserDropdown: boolean,
  treeType: TreeType,
  typeAlerts: AlertTypeType[],
  typeName: string,
  typeProps: PropertyType[],
  view: ViewType
};

export type UserType = {
  confirmEmail: string,
  confirmPassword: string,
  email: string,
  id: number,
  firstName: string,
  lastName: string,
  organization: string,
  password: string,
  phone: string,
  subscriptions: number[], // instance ids
  role: RoleType,
  version: number
};

export type ValidationFnType = string => string[];

export type ViewType =
  | 'Enums'
  | 'Instances'
  | 'Servers'
  | 'Train Control'
  | 'Types';
