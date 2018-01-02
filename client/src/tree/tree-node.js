// @flow

import React, {Component} from 'react';
import {dispatch} from 'redux-easy';

import Button from './button';

import './tree-node.css';

import type {AddNodePayloadType, NodeMapType, NodeType} from '../types';

type PropsType = {
  editedName: string,
  editingNodeId: number,
  level: number,
  newNodeName: string,
  node: NodeType,
  nodeMap: NodeMapType
};

const URL_PREFIX = 'http://localhost:3001/types';

function getSortedChildren(node: NodeType, nodeMap: NodeMapType): NodeType[] {
  const children = node.children.map(id => nodeMap[id]);
  return children.sort(nodeCompare);
}

function nodeCompare(node1: NodeType, node2: NodeType) {
  return node1.name.localeCompare(node2.name);
}

class TreeNode extends Component<PropsType> {
  addNode = async (parent: NodeType) => {
    const name = this.props.newNodeName;
    if (!name) return;

    const parentId = parent.id;
    try {
      // Add new type to database.
      const options = {
        method: 'POST',
        body: JSON.stringify({name, parentId})
      };
      const url = URL_PREFIX;
      const res = await fetch(url, options);
      const id = Number(await res.text());

      // Add new type to Redux state.
      const payload: AddNodePayloadType = {id, name, parentId};
      dispatch('addNode', payload);

      dispatch('setNewNodeName', '');
    } catch (e) {
      console.error('tree-builder.js addNode:', e.message);
    }
  };

  deleteNode = async (node: NodeType) => {
    try {
      // Delete type from database.
      const options = {method: 'DELETE'};
      const url = `${URL_PREFIX}/${node.id}`;
      await fetch(url, options);

      dispatch('deleteNode', node);
    } catch (e) {
      console.error('tree-builder.js deleteNode:', e.message);
    }
  };

  editNode = (event: SyntheticInputEvent<HTMLInputElement>) =>
    dispatch('editNode', event.target.value);

  handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewNodeName', event.target.value);
  };

  handleEscape = (event: SyntheticInputEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') this.toggleEditNode();
  };

  isEditing = (node: NodeType) => node.id === this.props.editingNodeId;

  moveCursor = (event: SyntheticInputEvent<HTMLInputElement>) => {
    const {target} = event;
    const {value} = target;
    target.selectionStart = value.length;
  };

  saveChange = async () => {
    const {editedName: name, editingNodeId: id} = this.props;
    const payload = {id, name};
    try {
      // Update type name in database.
      const options = {
        method: 'PATCH',
        body: JSON.stringify({name})
      };
      const url = `${URL_PREFIX}/${id}`;
      await fetch(url, options);

      dispatch('saveNode', payload);
    } catch (e) {
      console.error('tree-builder.js saveChange:', e.message);
    }
  };

  toggleEditNode = () => dispatch('toggleEditNode', this.props.node);

  toggleExpandNode = () => dispatch('toggleExpandNode', this.props.node.id);

  renderChildren = () => {
    const {level, node, nodeMap} = this.props;
    return getSortedChildren(node, nodeMap).map(child => (
      <TreeNode
        {...this.props}
        key={`tn${node.id}`}
        level={level + 1}
        node={child}
      />
    ));
  };

  render = () => {
    const {editedName, level, newNodeName, node} = this.props;

    if (!node.parentId) return this.renderChildren();

    const direction = node.expanded ? 'down' : 'right';
    const triangleClasses =
      node.children.length === 0 ? '' : `fa fa-caret-${direction}`;

    return (
      <div className={`tree-node tree-level-${level}`}>
        <div
          className={`expand ${triangleClasses}`}
          onClick={this.toggleExpandNode}
        />
        {this.isEditing(node) ? (
          <input
            type="text"
            autoFocus
            onBlur={this.saveChange}
            onChange={this.editNode}
            onFocus={this.moveCursor}
            onKeyDown={this.handleEscape}
            value={editedName}
          />
        ) : (
          <div className="tree-node-name" onClick={() => this.toggleEditNode()}>
            {node.name}
          </div>
        )}
        <Button
          className="addNode"
          disabled={newNodeName === ''}
          icon="plus"
          onClick={() => this.addNode(node)}
        />
        <Button
          className="deleteNode"
          icon="trash-o"
          onClick={() => this.deleteNode(node)}
        />
        <Button
          className="editNode"
          icon="pencil"
          onClick={() => this.toggleEditNode()}
        />
        {node.expanded ? this.renderChildren() : null}
      </div>
    );
  };
}

export default TreeNode;
