// @flow

import upperFirst from 'lodash/upperFirst';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Tab, TabList, TabPanel, Tabs} from 'react-tabs';
import {dispatchSet} from 'redux-easy';

import MessageServers from '../message-servers/message-servers';
import TreeBuilder from '../tree/tree-builder';

import type {NodeMapType, StateType, TreeType, UiType} from '../types';

import './left-nav.css';
import 'react-tabs/style/react-tabs.css';

type PropsType = {
  instanceNodeMap: NodeMapType,
  subscriptions: number[],
  typeNodeMap: NodeMapType,
  ui: UiType
};

const TREE_TYPES = ['', 'type', 'instance'];

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
    if (index === lastIndex) return;
    dispatchSet('ui.treeType', TREE_TYPES[index]);
  };

  render() {
    //const {treeType} = this.props.ui;
    //const isType = treeType === 'type';
    //const tabIndex = isType ? 1 : 2;
    return (
      <section className="left-nav">
        <Tabs onSelect={this.handleTabSelect}>
          <TabList>
            <Tab>Servers</Tab>
            <Tab>Type</Tab>
            <Tab>Instance</Tab>
          </TabList>
          <TabPanel>
            <MessageServers />
          </TabPanel>
          <TabPanel>{this.getTree('type')}</TabPanel>
          <TabPanel>{this.getTree('instance')}</TabPanel>
        </Tabs>
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
