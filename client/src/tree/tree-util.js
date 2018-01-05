// @flow

import {dispatch} from 'redux-easy';

import {getUrlPrefix} from '../util/rest-util';

import type {
  AddNodePayloadType,
  NewNodeNamePayloadType,
  NodeType,
  TreeType
} from '../types';

const URL_PREFIX = getUrlPrefix() + 'tree/';

export async function addNode(kind: TreeType, name: string, parent: NodeType) {
  if (!name) return;

  const parentId = parent.id;
  try {
    // Add new node to database.
    const options = {
      method: 'POST',
      body: JSON.stringify({name, parentId})
    };
    const url = URL_PREFIX + kind;
    const res = await fetch(url, options);
    const id = Number(await res.text());

    // Add new node to Redux state.
    const payload1: AddNodePayloadType = {id, kind, name, parentId};
    dispatch('addNode', payload1);

    const payload2: NewNodeNamePayloadType = {kind, name: ''};
    dispatch('setNewNodeName', payload2);
  } catch (e) {
    console.error('tree-builder.js addNode:', e.message);
  }
}
