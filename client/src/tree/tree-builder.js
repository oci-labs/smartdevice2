// @flow

import _ from 'lodash/string';
import React, {Component} from 'react';
import {dispatch} from 'redux-easy';

import Button from './button';
import TreeNode from './tree-node';
import {addNode} from './tree-util';

import './tree-builder.css';

import type {
  NewNodeNamePayloadType,
  NodeMapType,
  NodeType,
  SetNodesPayloadType
} from '../types';

type PropsType = {
  editedName: string,
  editingNode: NodeType,
  kind: string,
  newNodeName: string,
  nodeMap: NodeMapType
};

const ROOT_ID = 1;
const URL_PREFIX = 'http://localhost:3001/';

class TreeBuilder extends Component<PropsType> {

  componentDidMount() {
    this.load();
  }

  handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    const {kind} = this.props;
    const name = event.target.value;
    const payload: NewNodeNamePayloadType = {kind, name};
    dispatch('setNewNodeName', payload);
  };

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
    const {kind, newNodeName, nodeMap} = this.props;
    const rootNode = nodeMap[ROOT_ID];
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
          onClick={() => addNode(kind, newNodeName, rootNode)}
        />
        <TreeNode {...this.props} key="tn0" level={0} node={rootNode} />
      </div>
    );
  }
}

export default TreeBuilder;
