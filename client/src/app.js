// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import TreeBuilder from './tree-builder/tree-builder';

import type {StateType} from './types';
import type {TreeNodeType} from './util/tree-util';

import './app.css';

type PropsType = {
  editedName: string,
  editingNode: TreeNodeType,
  newTypeName: string,
  typeRootNode: TreeNodeType
};

class App extends Component<PropsType> {
  render() {
    const {editedName, editingNode, newTypeName, typeRootNode} = this.props;
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">SmartDevice</h1>
        </header>
        <TreeBuilder
          editedName={editedName}
          editingNode={editingNode}
          newNodeName={newTypeName}
          rootNode={typeRootNode}
        />
      </div>
    );
  }
}

const mapState = (state: StateType): Object => {
  const {newTypeName, typeRootNode, ui: {editedName, editingNode}} = state;
  return {editedName, editingNode, newTypeName, typeRootNode};
};

export default connect(mapState)(App);
