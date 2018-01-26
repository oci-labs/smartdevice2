// @flow

import capitalize from 'lodash/capitalize';
import React, {Component} from 'react';
import {dispatch, dispatchSet, getState, Input} from 'redux-easy';

import TreeNode from './tree-node';
import {addNode} from './tree-util';
import Button from '../share/button';
import {getJson, getText} from '../util/rest-util';

import './tree-builder.css';

import type {
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

const getRootId = kind => getState()[kind + 'RootId'];

const getRootNode = (kind, nodeMap) => nodeMap[getRootId(kind)];

function haveNodeMap(kind: TreeType): boolean {
  const prop = kind + 'NodeMap';
  const nodeMap = getState()[prop];
  // We have have zero nodes or just the root node.
  // In either case, treat it like
  // we haven't loaded the real nodes yet.
  return Object.keys(nodeMap).length > 1;
}

const haveRootId = (kind: TreeType): boolean => Boolean(getRootId(kind));

class TreeBuilder extends Component<PropsType> {
  componentDidMount() {
    this.load(this.props.kind);
  }

  componentWillReceiveProps(nextProps: PropsType) {
    const currentKind = this.props.kind;
    const newKind = nextProps.kind;
    if (global.reloading || newKind !== currentKind) this.load(newKind);
  }

  // Loads nodes from database.
  load = async (kind: TreeType) => {
    if (!haveRootId(kind)) {
      const rootId = Number(await getText(`${kind}s/root`));
      dispatchSet(kind + 'RootId', rootId);
    }

    if (haveNodeMap(kind)) return;

    const json = await getJson(kind);
    const nodes = ((json: any): NodeType[]);
    const payload: SetNodesPayloadType = {kind, nodes};
    dispatch('setNodes', payload);

    global.reloading = false;
  };

  toggleExpandAll = () => {
    const {kind} = this.props;
    dispatch('toggleExpandAll', kind);
  };

  render() {
    const {kind, newNodeName, nodeMap} = this.props;
    const rootNode = getRootNode(kind, nodeMap);
    if (!rootNode) return null;

    const isExpanded = rootNode.expanded;

    return (
      <div className="tree-builder">
        <div className="new-div">
          <label>New {capitalize(kind)}</label>
          <Input path={`ui.${kind}Name`} type="text" autoFocus />
        </div>
        <Button
          icon={isExpanded ? 'compress' : 'expand'}
          onClick={() => this.toggleExpandAll()}
          tooltip={isExpanded ? 'collapse all' : 'expand all'}
        />
        <Button
          className="add"
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
