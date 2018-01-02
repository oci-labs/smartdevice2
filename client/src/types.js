// @flow

export type ActionType = {
  type: string,
  payload?: any
};

export type AddNodePayloadType = {
  id: number,
  kind: string,
  name: string,
  parentId: number
};

export type NewNodeNamePayloadType = {
  kind: string,
  name: string
};

export type NodePayloadType = {
  kind: string,
  node: NodeType
};

export type SetNodesPayloadType = {
  kind: string,
  nodes: NodeType[]
};

export type AddressType = {
  street: string,
  city: string,
  state: string,
  zip: string
};

export type AlertType = {
  count: number,
  level: number
};

export type HistoryType = {
  location: {
    pathname: string
  },
  push: Function
};

export type NodeType = {
  id: number,
  children: number[],
  expanded?: boolean,
  name: string,
  parentId: number,
  type?: NodeType // for instance nodes
};

export type NodeMapType = {[id: number]: NodeType};

export type InstanceType = {
  children: InstanceType[],
  name: string,
  parent: InstanceType,
  type: NodeType
};

export type ModalType = {
  message: string,
  open: boolean,
  title: string
};

export type RoleType = 'admin' | 'service' | 'spectator';

export type UiType = {
  editedName: string,
  editingNode: ?NodeType,
  instanceName: string,
  modal: ModalType,
  typeName: string
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
  role: RoleType,
  version: number
};

export type StateType = {
  errors: Set<string>,
  instanceNodeMap: NodeMapType,
  typeNodeMap: NodeMapType,
  ui: UiType,
  user: UserType
};

export type StoreType = {
  getActions(): ActionType[],
  getState(): Object,
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

export type ValidationFnType = (string) => string[];
