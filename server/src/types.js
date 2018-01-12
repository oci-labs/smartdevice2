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

export type PrimitiveType = boolean | number | string;
