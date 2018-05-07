// @flow

import upperFirst from 'lodash/upperFirst';
import React, {Component} from 'react';
import {dispatch, dispatchSet, getState} from 'redux-easy';

import TreeNode from './tree-node';
import {createNode} from './tree-util';
import Button from '../share/button';
import {showPrompt} from '../share/sd-modal';
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

export async function loadTree(kind: TreeType) {
  if (!haveRootId(kind)) {
    const rootId = Number(await getText(`${kind}s/root`));
    dispatchSet(kind + 'RootId', rootId);
  }

  if (haveNodeMap(kind)) return;

  const json = await getJson(kind);
  const nodes = ((json: any): NodeType[]);
  const payload: SetNodesPayloadType = {kind, nodes};
  dispatch('setNodes', payload);
}

class TreeBuilder extends Component<PropsType> {
  addNode = () => {
    const {kind} = this.props;
    showPrompt({
      buttonText: 'Create',
      label: 'Name',
      okCb: () => createNode(kind),
      path: `ui.${kind}Name`,
      title: `Add ${upperFirst(kind)}`
    });
  };

  async componentDidMount() {
    await loadTree(this.props.kind);
    this.toggleExpandAll();
  }

  async componentWillReceiveProps(nextProps: PropsType) {
    const currentKind = this.props.kind;
    const newKind = nextProps.kind;
    if (newKind !== currentKind) {
      await loadTree(newKind);
      this.toggleExpandAll();
    }
  }

  toggleExpandAll = () => {
    const {kind} = this.props;
    dispatch('toggleExpandAll', kind);
  };

  render() {
    const {kind, nodeMap} = this.props;
    const rootNode = getRootNode(kind, nodeMap);
    if (!rootNode) return null;

    const isExpanded = rootNode.expanded;

    return (
      <div className="tree-builder">
        <h3>{upperFirst(kind)}s</h3>
        <Button
          icon={isExpanded ? 'compress' : 'expand'}
          onClick={() => this.toggleExpandAll()}
          tooltip={isExpanded ? 'collapse all' : 'expand all'}
        />
        <Button key="add" className="add" icon="plus" onClick={this.addNode} />
        <TreeNode {...this.props} key="tn0" level={0} node={rootNode} />
      </div>
    );
  }
}

export default TreeBuilder;
