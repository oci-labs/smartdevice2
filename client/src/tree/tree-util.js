// @flow

import sortBy from 'lodash/sortBy';
import React from 'react';
import {dispatch, dispatchSet, getState} from 'redux-easy';

import {postJson} from '../util/rest-util';
import Button from '../share/button';
import {hideModal, showModal} from '../share/sd-modal';

import type {AddNodePayloadType, NodeType, TreeType} from '../types';

let typeId;

/**
 * Gets the type name for an instance node.
 */
export function getType(node: NodeType): string {
  const {typeNodeMap} = getState();
  const typeNode = typeNodeMap[node.typeId];
  return typeNode ? typeNode.name : '';
}

function handleTypeChange(event): void {
  typeId = event.target.value;
}

function handleTypeSelectCancel(): void {
  hideModal();
}

function handleTypeSelectOk(name, parent): void {
  reallyAddNode('instance', name, parent, typeId);
  hideModal();
}

function promptForType(name, parent, childTypes: NodeType[]): void {
  const sortedChildTypes = sortBy(childTypes, ['name']);
  typeId = sortedChildTypes[0].id;

  const renderFn = () => (
    <div>
      <select onChange={handleTypeChange}>
        {sortedChildTypes.map(childType => (
          <option key={childType.id} value={childType.id}>
            {childType.name}
          </option>
        ))}
      </select>
      <div className="button-row">
        <Button label="OK" onClick={() => handleTypeSelectOk(name, parent)} />
        <Button label="Cancel" onClick={handleTypeSelectCancel} />
      </div>
    </div>
  );

  showModal({title: 'Choose Child Type', renderFn});
}

export function addNode(kind: TreeType, name: string, parent: NodeType): void {
  if (!name) return;

  let typeId = 0;

  if (kind !== 'instance') {
    reallyAddNode(kind, name, parent);
    return;
  }

  const state = getState();
  const {typeNodeMap} = state;

  let childTypes;
  if (parent.typeId) {
    // Get the type of the parent.
    const parentTypeNode: NodeType = typeNodeMap[parent.typeId];

    // Get all child types of the parent type.
    const childTypeIds = parentTypeNode.children;
    childTypes = childTypeIds.map(id => typeNodeMap[id]);
  } else {
    // Find the root type node.
    const typeNodes: NodeType[] = ((Object.values(
      typeNodeMap
    ): any): NodeType[]);
    const rootTypeNode = typeNodes.find(typeNode => !typeNode.parentId);
    if (!rootTypeNode) throw new Error('failed to find root type node');

    // Get all child types directly under the root type node.
    const rootId = rootTypeNode.id;
    childTypes = typeNodes.filter(typeNode => typeNode.parentId === rootId);
  }

  // If there is more than one child type,
  // ask the user to pick one.
  if (childTypes.length === 1) {
    typeId = childTypes[0].id;
    reallyAddNode(kind, name, parent, typeId);
  } else {
    promptForType(name, parent, childTypes);
  }
}

async function reallyAddNode(
  kind: TreeType,
  name: string,
  parent: NodeType,
  typeId?: number
): Promise<void> {
  const parentId = parent.id;

  try {
    // Add new node to database.
    const node: Object = {name, parentId};
    if (kind === 'instance') node.typeId = typeId;
    const res = await postJson(kind, node);
    const id = Number(await res.text());

    // Add new node to Redux state.
    const payload: AddNodePayloadType = {id, kind, name, parentId, typeId};
    dispatch('addNode', payload);

    // Clear the node name input.
    dispatchSet(`ui.${kind}Name`, '');
  } catch (e) {
    console.error('tree-builder.js addNode:', e.message);
  }
}
