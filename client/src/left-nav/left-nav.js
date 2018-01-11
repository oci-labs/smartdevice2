// @flow

import upperFirst from 'lodash/upperFirst';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Tab, TabList, TabPanel, Tabs} from 'react-tabs';
import {dispatch} from 'redux-easy';

import TreeBuilder from '../tree/tree-builder';

import type {NodeMapType, StateType, UiType} from '../types';

import './left-nav.css';
import 'react-tabs/style/react-tabs.css';

type PropsType = {
  instanceNodeMap: NodeMapType,
  subscriptions: number[],
  typeNodeMap: NodeMapType,
  ui: UiType
};

class LeftNav extends Component<PropsType> {
  getTree = () => {
    const {instanceNodeMap, subscriptions, typeNodeMap, ui} = this.props;
    const {editedName, editingNode, instanceName, typeName, treeType} = ui;

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
    if (index === lastIndex) return;
    const treeType = index === 0 ? 'type' : 'instance';
    dispatch('setTreeType', treeType);
  };

  render() {
    const {treeType} = this.props.ui;
    const isType = treeType === 'type';
    const tabIndex = isType ? 0 : 1;

    return (
      <section className="left-nav">
        <Tabs onSelect={this.handleTabSelect} selectedIndex={tabIndex}>
          <TabList>
            <Tab>Type</Tab>
            <Tab>Instance</Tab>
          </TabList>
          <TabPanel />
          <TabPanel />
        </Tabs>
        {this.getTree()}
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {instanceNodeMap, typeNodeMap, ui, user: {subscriptions}} = state;
  return {
    instanceNodeMap,
    subscriptions,
    typeNodeMap,
    ui
  };
};

export default connect(mapState)(LeftNav);
