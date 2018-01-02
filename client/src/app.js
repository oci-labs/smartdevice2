// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import TreeBuilder from './tree/tree-builder';

import type {NodeMapType, NodeType, StateType} from './types';

import './app.css';

type PropsType = {
  editedName: string,
  editingNode: NodeType,
  instanceNodeMap: NodeMapType,
  newNodeName: string,
  typeNodeMap: NodeMapType
};

class App extends Component<PropsType> {

  render() {
    const {
      editedName,
      editingNode,
      instanceNodeMap,
      newNodeName,
      typeNodeMap
    } = this.props;

    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">SmartDevice</h1>
        </header>
        <TreeBuilder
          editedName={editedName}
          editingNode={editingNode}
          kind="type"
          newNodeName={newNodeName}
          nodeMap={typeNodeMap}
        />
        <TreeBuilder
          editedName={editedName}
          editingNode={editingNode}
          kind="instance"
          newNodeName={newNodeName}
          nodeMap={instanceNodeMap}
        />
      </div>
    );
  }
}

const mapState = (state: StateType): Object => {
  const {
    instanceNodeMap,
    instanceRootId,
    typeNodeMap,
    typeRootId,
    ui: {editedName, editingNode, newNodeName}
  } = state;
  return {
    editedName,
    editingNode,
    instanceNodeMap,
    instanceRootId,
    newNodeName,
    typeNodeMap,
    typeRootId
  };
};

export default connect(mapState)(App);
