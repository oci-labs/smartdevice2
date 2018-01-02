// @flow

import _ from 'lodash/string';
import React, {Component} from 'react';
import {dispatch} from 'redux-easy';

import Button from './button';
import TreeNode from './tree-node';

import './tree-builder.css';

import type {
  AddNodePayloadType,
  NodeMapType,
  NodeType,
  SetNodesPayloadType
} from '../types';

type PropsType = {
  editedName: string,
  editingNodeId: number,
  kind: string,
  newNodeName: string,
  nodeMap: NodeMapType,
  rootId: number
};

const URL_PREFIX = 'http://localhost:3001/';

class TreeBuilder extends Component<PropsType> {
  addNode = async (parent: NodeType) => {
    const name = this.props.newNodeName;
    if (!name) return;

    const parentId = parent.id;
    try {
      // Add new node to database.
      const options = {
        method: 'POST',
        body: JSON.stringify({name, parentId})
      };
      const {kind} = this.props;
      const url = URL_PREFIX + kind;
      const res = await fetch(url, options);
      const id = Number(await res.text());

      // Add new node to Redux state.
      const payload: AddNodePayloadType = {id, kind, name, parentId};
      dispatch('addNode', payload);

      dispatch('setNewNodeName', '');
    } catch (e) {
      console.error('tree-builder.js addNode:', e.message);
    }
  };

  componentDidMount() {
    this.load();
  }

  handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewNodeName', event.target.value);
  };

  isEditing = (node: NodeType) => node.id === this.props.editingNodeId;

  // Loads nodes from database.
  load = async () => {
    try {
      const {kind} = this.props;
      const url = URL_PREFIX + kind;
      const res = await fetch(url);
      const nodes = await res.json();
      const payload: SetNodesPayloadType = {kind, nodes};
      dispatch('setNodes', payload);
    } catch (e) {
      console.error('tree-builder.js load:', e.message);
    }
  };

  render() {
    const {kind, newNodeName, nodeMap, rootId} = this.props;
    const rootNode = nodeMap[rootId];
    if (!rootNode) return null;

    return (
      <div className="tree-builder">
        <div>
          <label>New {_.capitalize(kind)}</label>
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
        <TreeNode {...this.props} key="tn0" level={0} node={rootNode} />
      </div>
    );
  }
}

export default TreeBuilder;
