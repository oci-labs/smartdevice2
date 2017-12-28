// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import TreeBuilder from './tree-builder/tree-builder';

import type {StateType} from './types';
import type {TreeNodeType} from './util/tree-util';

import './app.css';

type PropsType = {
  editNode: TreeNodeType,
  newTypeName: string,
  typeRootNode: TreeNodeType
};

class App extends Component<PropsType> {
  render() {
    const {editNode, newTypeName, typeRootNode} = this.props;
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">SmartDevice</h1>
        </header>
        <TreeBuilder
          editNode={editNode}
          newNodeName={newTypeName}
          rootNode={typeRootNode}
        />
      </div>
    );
  }
}

const mapState = (state: StateType): Object => {
  const {newTypeName, typeRootNode, ui: {editNode}} = state;
  return {editNode, newTypeName, typeRootNode};
};

export default connect(mapState)(App);
