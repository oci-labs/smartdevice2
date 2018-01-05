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
  instanceNode: ?NodeType
};

class ParentInstances extends Component<PropsType> {
  renderChild = (child: NodeType) => <Node key={child.id} node={child} />;

  renderSelection = () => {
    const {instanceNode, instanceNodeMap} = this.props;
    if (!instanceNode) {
      return (
        <div key="no-selection">Select an instance from the left nav.</div>
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
        <h3 key="title">Parent View</h3>
        {this.renderSelection()}
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {instanceNodeMap, ui} = state;
  const {selectedInstanceNodeId} = ui;
  const instanceNode = instanceNodeMap[selectedInstanceNodeId];
  return {instanceNode, instanceNodeMap};
};

export default connect(mapState)(ParentInstances);
