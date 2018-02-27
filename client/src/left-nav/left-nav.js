// @flow

import upperFirst from 'lodash/upperFirst';
import React, {Component} from 'react';
import {dispatchSet, watch} from 'redux-easy';

import TreeBuilder from '../tree/tree-builder';

import type {NodeMapType, TreeType, UiType} from '../types';

import './left-nav.css';
import 'react-tabs/style/react-tabs.css';

type PropsType = {
  instanceNodeMap: NodeMapType,
  subscriptions: number[],
  typeNodeMap: NodeMapType,
  ui: UiType
};

const TREE_TYPES = ['type', 'instance'];

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

  handleTabSelect = (index: number, lastIndex: number) => {
    console.log('left-nav.js handleTabSelect: index =', index);
    console.log('left-nav.js handleTabSelect: lastIndex =', lastIndex);
    if (index === lastIndex) return;
    dispatchSet('ui.view', TREE_TYPES[index]);
  };

  renderGuts = () => {
    const {view} = this.props.ui;
    return view === 'instance' || view === 'type' ? this.getTree(view) : null;
  };

  render() {
    return (
      <section className="left-nav">
        {this.renderGuts()}
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
