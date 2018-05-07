// @flow

import upperFirst from 'lodash/upperFirst';
import React, {Component} from 'react';
import {watch} from 'redux-easy';

import TreeBuilder from '../tree/tree-builder';

import type {NodeMapType, TreeType, UiType} from '../types';

import './left-nav.css';

type PropsType = {
  instanceNodeMap: NodeMapType,
  subscriptions: number[],
  typeNodeMap: NodeMapType,
  ui: UiType
};

class LeftNav extends Component<PropsType> {
  getTree = (treeType: TreeType) => {
    const {instanceNodeMap, subscriptions, typeNodeMap, ui} = this.props;
    const {editedName, editingNode, instanceName, typeName} = ui;

    const isType = treeType === 'type';
    const newNodeName = isType ? typeName : instanceName;
    const nodeMap = isType ? typeNodeMap : instanceNodeMap;
    const prop = `selected${upperFirst(treeType)}NodeId`;
    const selectedNodeId = ui[prop];

    return (
      <TreeBuilder
        editedName={editedName}
        editingNode={editingNode}
        kind={treeType}
        newNodeName={newNodeName}
        nodeMap={nodeMap}
        selectedNodeId={selectedNodeId}
        subscriptions={subscriptions}
      />
    );
  };

  render() {
    return (
      <section className="left-nav">
        {this.getTree(this.props.ui.treeType)}
      </section>
    );
  }
}

export default watch(LeftNav, {
  instanceNodeMap: '',
  typeNodeMap: '',
  ui: '',
  subscriptions: 'user.subscriptions'
});
