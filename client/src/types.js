// @flow

export type ActionType = {
  type: string,
  payload?: any
};

export type AddNodePayloadType = {
  id: number,
  kind: TreeType,
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
  sticky: boolean,
  typeId: number
};

export type ChangeType = {
  instanceId: number,
  property: string,
  value: PrimitiveType
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

export type NodeMapType = {[id: number]: NodeType};

export type NodePayloadType = {
  kind: TreeType,
  node: NodeType
};

export type NodeType = {
  id: number,
  children: number[],
  expanded?: boolean,
  name: string,
  parentId: number,
  selected?: boolean,
  typeId?: number // for instance nodes
};

export type ModalType = {
  error?: boolean,
  message?: string,
  open?: boolean,
  renderFn?: Function,
  title: string
};

export type PrimitiveType = boolean | number | string;

export type PropertyKindType = 'boolean' | 'number' | 'text';

export type PropertyType = {
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
  errors: Set<string>,
  instanceData: Object,
  instanceNodeMap: NodeMapType,
  typeNodeMap: NodeMapType,
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

// These strings must correspond to the name of a database table.
export type TreeType = 'type' | 'instance';

export type UiType = {
  editedName: string, // within type or instance tree
  editingNode: ?NodeType, // within type or instance tree
  instanceName: string,
  modal: ModalType,
  newAlertExpression: string,
  newAlertName: string,
  newAlertSticky: boolean,
  newPropName: string,
  newPropType: string,
  selectedChildNodeId: number,
  selectedInstanceNodeId: number,
  selectedTypeNodeId: number,
  treeType: TreeType,
  typeAlerts: AlertTypeType[],
  typeName: string,
  typeProps: PropertyType[]
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

export type ValidationFnType = (string) => string[];
