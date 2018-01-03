// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import TreeBuilder from './tree/tree-builder';

import type {NodeMapType, NodeType, StateType, TreeType} from './types';

import './app.css';

type PropsType = {
  editedName: string,
  editingNode: NodeType,
  instanceName: string,
  instanceNodeMap: NodeMapType,
  subscriptions: number[],
  treeType: TreeType,
  typeName: string,
  typeNodeMap: NodeMapType
};

class App extends Component<PropsType> {

  getTree = () => {
    const {
      editedName,
      editingNode,
      instanceName,
      instanceNodeMap,
      subscriptions,
      typeName,
      typeNodeMap,
      treeType
    } = this.props;
    const isType = treeType === 'type';
    const newNodeName = isType ? typeName : instanceName;
    const nodeMap = isType ? typeNodeMap : instanceNodeMap;

    return (
      <TreeBuilder
        editedName={editedName}
        editingNode={editingNode}
        kind={treeType}
        newNodeName={newNodeName}
        nodeMap={nodeMap}
        subscriptions={subscriptions}
      />
    );
  };

  treeTypeChange = (e: SyntheticInputEvent<HTMLInputElement>) =>
    dispatch('setTreeType', e.target.value);

  render() {
    const {treeType} = this.props;

    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">SmartDevice</h1>
        </header>
        <section id="body">
          <section id="left">
            <div className="tree-radio">
              <input
                type="radio"
                value="type"
                name="treeType"
                checked={treeType === 'type'}
                onChange={this.treeTypeChange}
              />
              Type
              <input
                type="radio"
                value="instance"
                name="treeType"
                checked={treeType === 'instance'}
                onChange={this.treeTypeChange}
              />
              Instance
            </div>
            {this.getTree()}
          </section>
          <section id="middle">
            <h3>Middle</h3>
          </section>
          <section id="right">
            <h3>Right</h3>
          </section>
        </section>
      </div>
    );
  }
}

const mapState = (state: StateType): Object => {
  const {
    instanceNodeMap,
    typeNodeMap,
    ui: {editedName, editingNode, instanceName, typeName, treeType},
    user: {subscriptions}
  } = state;
  return {
    editedName,
    editingNode,
    instanceName,
    instanceNodeMap,
    subscriptions,
    treeType,
    typeName,
    typeNodeMap
  };
};

export default connect(mapState)(App);
