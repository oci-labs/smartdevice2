// @flow

export type AlertType = {
  id: number,
  instanceId: number,
  name: string,
  timestamp: number
};

export type AlertTypeType = {
  name: string,
  expression: string,
  id: number,
  typeId: number
};

export type MessageServerType = {
  id: number,
  host: string,
  port: number
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
