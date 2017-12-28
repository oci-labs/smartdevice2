// @flow

export type ActionType = {
  type: string,
  payload?: any
};

export type TreeNodeType = {
  children: TreeNodeType[],
  expanded: boolean,
  name: string,
  parentPath?: string,
  type?: TreeNodeType // for instance nodes
};

export type AddNodePayloadType = {
  name: string,
  parentPath: string
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

export type InstanceType = {
  children: InstanceType[],
  name: string,
  parent: InstanceType,
  type: TreeNodeType
};

export type ModalType = {
  message: string,
  open: boolean,
  title: string
};

export type RoleType = 'admin' | 'service' | 'spectator';

export type UiType = {
  modal: ModalType
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
  instanceRootNode: TreeNodeType,
  newInstanceName: string,
  newTypeName: string,
  typeRootNode: TreeNodeType,
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

export type TreeBuilderType = {
  newNodeName: string,
  rootNode: TreeNodeType
};

export type ValidationFnType = (string) => string[];
