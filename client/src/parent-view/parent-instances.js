// @flow

import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {connect} from 'react-redux';

import Node from './node';
import {getType} from '../tree/tree-util';
import type {NodeMapType, NodeType, StateType} from '../types';

import './parent-instances.css';

type PropsType = {
  instanceNodeMap: NodeMapType,
  instanceNode: ?NodeType,
  selectedChildNodeId: number
};

class ParentInstances extends Component<PropsType> {
  renderChild = (child: NodeType) => {
    const isSelected = child.id === this.props.selectedChildNodeId;
    return <Node key={child.id} isSelected={isSelected} node={child} />;
  }

  renderSelection = () => {
    const {instanceNode, instanceNodeMap} = this.props;
    if (!instanceNode) {
      return (
        <div key="no-selection">Select an instance in the left nav.</div>
      );
    }

    const {children} = instanceNode;
    const childNodes = children.map(id => instanceNodeMap[id]);
    const sortedChildren = sortBy(childNodes, ['name']);
    const type = getType(instanceNode);
    return (
      <div key={instanceNode.id}>
        <div>
          You selected {type} {instanceNode.name}.
        </div>
        {sortedChildren.map(child => this.renderChild(child))}
      </div>
    );
  };

  render() {
    return (
      <section className="parent-instances">
        {this.renderSelection()}
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {instanceNodeMap, ui} = state;
  const {selectedChildNodeId, selectedInstanceNodeId} = ui;
  const instanceNode = instanceNodeMap[selectedInstanceNodeId];
  return {instanceNode, instanceNodeMap, selectedChildNodeId};
};

export default connect(mapState)(ParentInstances);
