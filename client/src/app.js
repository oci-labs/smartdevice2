// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import TreeBuilder from './tree/tree-builder';

import type {NodeMapType, StateType} from './types';

import './app.css';

type PropsType = {
  editedName: string,
  editingNodeId: number,
  instanceNodeMap: NodeMapType,
  instanceRootId: number,
  newNodeName: string,
  typeNodeMap: NodeMapType,
  typeRootId: number
};

class App extends Component<PropsType> {

  render() {
    const {
      editedName,
      editingNodeId,
      instanceNodeMap,
      instanceRootId,
      newNodeName,
      typeNodeMap,
      typeRootId
    } = this.props;

    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">SmartDevice</h1>
        </header>
        <TreeBuilder
          editedName={editedName}
          editingNodeId={editingNodeId}
          kind="type"
          newNodeName={newNodeName}
          nodeMap={typeNodeMap}
          rootId={typeRootId}
        />
        {/*
        <TreeBuilder
          editedName={editedName}
          editingNodeId={editingNodeId}
          kind="instance"
          newNodeName={newNodeName}
          nodeMap={instanceNodeMap}
          rootId={instanceRootId}
        />
        */}
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
    ui: {editedName, editingNodeId, newNodeName}
  } = state;
  return {
    editedName,
    editingNodeId,
    instanceNodeMap,
    instanceRootId,
    newNodeName,
    typeNodeMap,
    typeRootId
  };
};

export default connect(mapState)(App);
