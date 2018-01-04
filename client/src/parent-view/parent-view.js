// @flow

import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {connect} from 'react-redux';

import Node from './node';
import type {NodeMapType, NodeType, StateType} from '../types';

import './parent-view.css';

type PropsType = {
  instanceNodeMap: NodeMapType,
  instanceNode: ?NodeType
};

class ParentView extends Component<PropsType> {
  renderChild = (child: NodeType) =>
    <Node key={child.id} node={child} />;

  renderGuts = () => {
    const {instanceNode} = this.props;

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
    const {instanceNodeMap} = this.props;
    const {children} = node;
    const childNodes = children.map(id => instanceNodeMap[id]);
    const sortedChildren = sortBy(childNodes, ['name']);
    return (
      <div key={node.id}>
        <div>You selected {node.name}.</div>
        {sortedChildren.map(child => this.renderChild(child))}
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
