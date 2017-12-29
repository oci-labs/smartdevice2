// @flow

import React, {Component} from 'react';
import {dispatch} from 'redux-easy';

import Button from './button';

import './tree-builder.css';

import type {AddNodePayloadType, NodeMapType, NodeType} from '../types';

type PropsType = {
  editedName: string,
  editingNodeId: number,
  newNodeName: string,
  nodeMap: NodeMapType,
  rootId: number
};

function nodeCompare(node1: NodeType, node2: NodeType) {
  return node1.name.localeCompare(node2.name);
}

class TreeBuilder extends Component<PropsType> {
  addNode = (parent: NodeType) => {
    const name = this.props.newNodeName;
    if (!name) return;

    try {
      const payload: AddNodePayloadType = {name, parentId: parent.id};
      dispatch('addNode', payload);
      dispatch('setNewNodeName', '');
    } catch (e) {
      console.error('tree-builder.js addNode:', e.message);
    }
  };

  deleteNode = (node: NodeType) => {
    dispatch('deleteNode', node);
  };

  editNode = (event: SyntheticInputEvent<HTMLInputElement>) =>
    dispatch('editNode', event.target.value);

  handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewNodeName', event.target.value);
  };

  isEditing = (node: NodeType) => node.id === this.props.editingNodeId;

  saveChange = () => {
    const {editedName: name, editingNodeId: id} = this.props;
    const payload = {id, name};
    dispatch('saveNode', payload);
  };

  toggleEditNode = (node: NodeType) => {
    dispatch('toggleEditNode', node);
  };

  renderNodes = (children: number[], level: number = 0) => {
    const {editedName, newNodeName, nodeMap} = this.props;

    const nodes = children.map(id => nodeMap[id]);
    nodes.sort(nodeCompare);

    return nodes.map(node => (
      <div className={'tree-node tree-level-' + level} key={node.name}>
        {this.isEditing(node) ? (
          <input
            type="text"
            onBlur={this.saveChange}
            onChange={this.editNode}
            value={editedName}
          />
        ) : (
          <div className="tree-node-name">{node.name}</div>
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
          onClick={() => this.toggleEditNode(node)}
        />
        {this.renderNodes(node.children, level + 1)}
      </div>
    ));
  };

  render() {
    const {newNodeName, nodeMap, rootId} = this.props;
    const rootNode = nodeMap[rootId];

    return (
      <div className="tree-builder">
        <div>
          <label>New Type</label>
          <input
            type="text"
            autoFocus
            onChange={this.handleChange}
            value={newNodeName}
          />
        </div>
        <Button
          className="addNode"
          disabled={newNodeName === ''}
          icon="plus"
          onClick={() => this.addNode(rootNode)}
        />
        {this.renderNodes(rootNode.children)}
      </div>
    );
  }
}

export default TreeBuilder;
