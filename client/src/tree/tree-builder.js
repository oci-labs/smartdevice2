// @flow

import capitalize from 'lodash/capitalize';
import React, {Component} from 'react';
import {dispatch, getState} from 'redux-easy';

import TreeNode from './tree-node';
import {addNode} from './tree-util';
import Button from '../share/button';
import {getJson} from '../util/rest-util';

import './tree-builder.css';

import type {
  NewNodeNamePayloadType,
  NodeMapType,
  NodeType,
  SetNodesPayloadType,
  TreeType
} from '../types';

type PropsType = {
  editedName: string,
  editingNode: ?NodeType,
  kind: TreeType,
  newNodeName: string,
  nodeMap: NodeMapType,
  selectedNodeId: number,
  subscriptions: number[]
};

const ROOT_ID = 1;

function haveNodeMap(kind: TreeType): boolean {
  const prop = kind + 'NodeMap';
  const nodeMap = getState()[prop];
  return Object.keys(nodeMap).length > 0;
}

class TreeBuilder extends Component<PropsType> {
  componentDidMount() {
    this.load(this.props.kind);
  }

  componentWillReceiveProps(nextProps: PropsType) {
    const currentKind = this.props.kind;
    const newKind = nextProps.kind;
    if (newKind !== currentKind) this.load(newKind);
  }

  handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    const {kind} = this.props;
    const name = event.target.value;
    const payload: NewNodeNamePayloadType = {kind, name};
    dispatch('setNewNodeName', payload);
  };

  // Loads nodes from database.
  load = async (kind: TreeType) => {
    if (haveNodeMap(kind)) return;

    const json = await getJson(kind);
    const nodes = ((json: any): NodeType[]);
    const payload: SetNodesPayloadType = {kind, nodes};
    dispatch('setNodes', payload);
  };

  render() {
    const {kind, newNodeName, nodeMap} = this.props;
    const rootNode = nodeMap[ROOT_ID];
    if (!rootNode) return null;

    return (
      <div className="tree-builder">
        <div>
          <label>New {capitalize(kind)}</label>
          <input
            type="text"
            autoFocus
            onChange={this.handleChange}
            value={newNodeName}
          />
        </div>
        <Button
          className="add-node"
          disabled={newNodeName === ''}
          icon="plus"
          onClick={() => addNode(kind, newNodeName, rootNode)}
          tooltip="add"
        />
        <TreeNode {...this.props} key="tn0" level={0} node={rootNode} />
      </div>
    );
  }
}

export default TreeBuilder;
