// @flow

import React, {Component} from 'react';
import {dispatch} from 'redux-easy';

import Button from './button';
import TreeNode from './tree-node';

import './tree-builder.css';

import type {AddNodePayloadType, NodeMapType, NodeType} from '../types';

type PropsType = {
  editedName: string,
  editingNodeId: number,
  newNodeName: string,
  nodeMap: NodeMapType,
  rootId: number
};

const URL_PREFIX = 'http://localhost:3001/types';

class TreeBuilder extends Component<PropsType> {

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

  componentDidMount() {
    this.load();
  }

  handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewNodeName', event.target.value);
  };

  isEditing = (node: NodeType) => node.id === this.props.editingNodeId;

  // Loads types from database.
  load = async () => {
    try {
      const url = URL_PREFIX;
      const res = await fetch(url);
      const types = await res.json();
      dispatch('setNodes', types);
    } catch (e) {
      console.error('tree-builder.js load:', e.message);
    }
  };

  render() {
    const {newNodeName, nodeMap, rootId} = this.props;
    const rootNode = nodeMap[rootId];
    if (!rootNode) return null;

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
        <TreeNode
          {...this.props}
          key="tn0"
          level={0}
          node={rootNode}
        />
      </div>
    );
  }
}

export default TreeBuilder;
