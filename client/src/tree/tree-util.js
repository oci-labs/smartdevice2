// @flow

import sortBy from 'lodash/sortBy';
import upperFirst from 'lodash/upperFirst';
import React from 'react';
import {dispatch, dispatchSet, getPathValue, getState} from 'redux-easy';

import {deleteResource, getJson, postJson} from '../util/rest-util';
import Button from '../share/button';
import {hideModal, showConfirm, showModal} from '../share/sd-modal';
import {values} from '../util/flow-util';

import type {AddNodePayloadType, NodeType, TreeType} from '../types';

let typeId;

export function addNode(kind: TreeType, name: string, parent: NodeType): void {
  if (!name) return;

  let typeId = 0;

  if (kind !== 'instance') {
    reallyAddNode(kind, name, parent);
    return;
  }

  const childTypes = getChildTypes(parent);

  // If there is more than one child type,
  // ask the user to pick one.
  if (childTypes.length === 1) {
    typeId = childTypes[0].id;
    reallyAddNode(kind, name, parent, typeId);
  } else {
    promptForType(name, parent, childTypes);
  }
}

export function createNode(kind: TreeType, parent?: NodeType): void {
  const state = getState();
  const name = state.ui[kind + 'Name'];
  if (!parent) {
    const rootId = state[kind + 'RootId'];
    parent = state[kind + 'NodeMap'][rootId];
  }
  addNode(kind, name, parent);
}

export async function deleteNode(
  kind: TreeType,
  node: NodeType
): Promise<void> {
  // Determine if any other nodes refer to this one.
  const inUse = await hasDependents(kind, node.id);
  if (inUse) {
    showConfirm({
      title: 'Node In Use',
      message:
        'Are you sure you want to delete this node?\n' +
        'At least one other node refers to it.',
      yesCb: () => doDelete(kind, node),
      noCb: () => {}
    });
  } else {
    doDelete(kind, node);
  }
}

async function doDelete(kind, node) {
  await deleteResource(`tree/${kind}/${node.id}`);
  dispatch('deleteNode', {kind, node});
}

export function getChildTypes(parent: NodeType): NodeType[] {
  let childTypes;

  const {typeNodeMap} = getState();
  if (parent.typeId) {
    // Get the type of the parent.
    const parentTypeNode: NodeType = typeNodeMap[parent.typeId];

    // Get all child types of the parent type.
    const childTypeIds = parentTypeNode.children;
    childTypes = childTypeIds.map(id => typeNodeMap[id]);
  } else {
    // Find the root type node.
    const typeNodes: NodeType[] = values(typeNodeMap);
    const rootTypeNode = typeNodes.find(typeNode => !typeNode.parentId);
    if (!rootTypeNode) throw new Error('failed to find root type node');

    // Get all child types directly under the root type node.
    const rootId = rootTypeNode.id;
    childTypes = typeNodes.filter(typeNode => typeNode.parentId === rootId);
  }

  return childTypes;
}

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

async function hasDependents(kind: TreeType, id: number): Promise<boolean> {
  const inUse = await getJson(`${kind}s/${id}/inuse`);
  return inUse;
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
        <Button onClick={() => handleTypeSelectOk(name, parent)}>OK</Button>
        <Button onClick={handleTypeSelectCancel}>Cancel</Button>
      </div>
    </div>
  );

  showModal({title: 'Choose Child Type', renderFn});
}

async function reallyAddNode(
  kind: TreeType,
  name: string,
  parent: NodeType,
  typeId?: number
): Promise<void> {
  const parentId = parent.id;

  const newTopType = kind === 'type' && parent.name === 'root';

  try {
    // Add new node to database.
    const node: Object = {name, parentId};
    let lastUsed;
    if (newTopType) {
      lastUsed = getPathValue('ui.lastUsedMessageServerId');
      if (lastUsed) node.messageServerId = lastUsed;
    }
    if (kind === 'instance') node.typeId = typeId;
    const res = await postJson(kind, node);
    const id = Number(await res.text());

    // Add new node to Redux state.
    const payload: AddNodePayloadType = {id, kind, name, parentId, typeId};
    if (newTopType && lastUsed) payload.messageServerId = lastUsed;
    dispatch('addNode', payload);

    hideModal();

    // Clear the node name input.
    dispatchSet(`ui.${kind}Name`, '');
    const path = `ui.selected${upperFirst(kind)}NodeId`;
    dispatchSet(path, id);
  } catch (e) {
    console.error('tree-builder.js addNode:', e.message);
  }
}
