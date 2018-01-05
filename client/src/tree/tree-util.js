// @flow

import {dispatch, getState} from 'redux-easy';

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

  let typeId = 0;

  if (kind === 'instance') {
    const state = getState();
    const {typeNodeMap} = state;

    let childTypes;
    console.log('tree-util.js x: parent =', parent);
    if (parent.typeId) {
      // Get the type of the parent.
      const parentTypeNode: NodeType = typeNodeMap[parent.typeId];
      console.log('tree-util.js x: parentTypeNode =', parentTypeNode);

      // Get all child types of the parent type.
      const childTypeIds = parentTypeNode.children;
      console.log('tree-util.js x: childTypeIds =', childTypeIds);
      childTypes = childTypeIds.map(id => typeNodeMap[id]);
    } else {
      // Find the root type node.
      const typeNodes: NodeType[] =
        ((Object.values(typeNodeMap): any): NodeType[]);
      const rootTypeNode = typeNodes.find(typeNode => !typeNode.parentId);
      if (!rootTypeNode) throw new Error('failed to find root type node');

      // Get all child types directly under the root type node.
      const rootId = rootTypeNode.id;
      childTypes = typeNodes.filter(typeNode => typeNode.parentId === rootId);
    }
    console.log('tree-util.js addNode: childTypes =', childTypes);

    // If there is more than one child type,
    // ask the user to pick one.
    if (childTypes.length === 1) {
      typeId = childTypes[0].id;
    } else {
      const typeNames = childTypes.map(childType => childType.name);
      dispatch('setModal', {
        open: true,
        title: 'Choose Child Type',
        message: 'Options are ' + typeNames.join(' and ')
      });
      return;
    }
  }

  const parentId = parent.id;
  try {
    // Add new node to database.
    const node: Object = {name, parentId};
    if (kind === 'instance') node.typeId = typeId;
    const options = {
      method: 'POST',
      body: JSON.stringify(node)
    };
    const url = URL_PREFIX + kind;
    const res = await fetch(url, options);
    const id = Number(await res.text());

    // Add new node to Redux state.
    const payload1: AddNodePayloadType = {id, kind, name, parentId, typeId};
    console.log('tree-util.js x: payload1 =', payload1);
    dispatch('addNode', payload1);

    const payload2: NewNodeNamePayloadType = {kind, name: ''};
    dispatch('setNewNodeName', payload2);
  } catch (e) {
    console.error('tree-builder.js addNode:', e.message);
  }
}
