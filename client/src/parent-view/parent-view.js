// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import Node from './node';
import type {NodeMapType, NodeType, StateType, TreeType} from '../types';

import './parent-view.css';

type PropsType = {
  instanceNodeMap: NodeMapType,
  instanceNode: ?NodeType,
  treeType: TreeType
};

class ParentView extends Component<PropsType> {
  renderChild = (id: number) => {
    const {instanceNodeMap} = this.props;
    const node = instanceNodeMap[id];
    return <Node node={node} />;
  };

  renderGuts = () => {
    const {instanceNode, treeType} = this.props;
    if (treeType !== 'instance') return null;

    return [
      <h3 key="title">Parent View</h3>,
      instanceNode
        ? this.renderSelection(instanceNode)
        : this.renderNoSelection()
    ];
  };

  renderNoSelection = () => (
    <div key="no-selection">Select an instance from the left nav.</div>
  );

  renderSelection = (node: NodeType) => {
    const {children} = node;
    return (
      <div>
        <div>You selected {node.name}.</div>
        {children.map(id => this.renderChild(id))}
      </div>
    );
  };

  render() {
    return <section className="parent-view">{this.renderGuts()}</section>;
  }
}

const mapState = (state: StateType): PropsType => {
  const {instanceNodeMap, ui} = state;
  const {selectedInstanceNodeId, treeType} = ui;
  const instanceNode = instanceNodeMap[selectedInstanceNodeId];
  return {instanceNode, instanceNodeMap, treeType};
};

export default connect(mapState)(ParentView);
