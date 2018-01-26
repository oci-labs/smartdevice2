// @flow

import capitalize from 'lodash/capitalize';
import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {connect} from 'react-redux';

import Node from '../node/node';
import {getType} from '../tree/tree-util';
import type {NodeMapType, NodeType, StateType} from '../types';

import './instance-hierarchy.css';

type PropsType = {
  instanceNodeMap: NodeMapType,
  instanceNode: ?NodeType,
  selectedChildNodeId: number
};

class ParentInstances extends Component<PropsType> {
  renderChild = (child: NodeType) => {
    const isSelected = child.id === this.props.selectedChildNodeId;
    return <Node key={child.id} isSelected={isSelected} node={child} />;
  };

  renderChildren = () => {
    const {instanceNode, instanceNodeMap} = this.props;
    if (!instanceNode) return;

    const {children} = instanceNode;
    if (children.length === 0) return <div>none</div>;

    const childNodes = children.map(id => instanceNodeMap[id]);
    const sortedChildren = sortBy(childNodes, ['name']);
    return sortedChildren.map(child => this.renderChild(child));
  };

  renderParent = () => {
    const {instanceNode, instanceNodeMap, selectedChildNodeId} = this.props;
    if (!instanceNode) return;

    const {parentId} = instanceNode;
    if (!parentId) return <div>none</div>;

    const parent = instanceNodeMap[parentId];
    if (!parent || parent.name === 'root') return <div>none</div>;

    const isSelected = parent.id === selectedChildNodeId;
    return <Node isSelected={isSelected} node={parent} />;
  };

  render() {
    const {instanceNode} = this.props;
    if (!instanceNode) {
      return (
        <section className="instance-hierarchy">
          <h3>Select an instance in the left nav.</h3>
        </section>
      );
    }

    const type = getType(instanceNode);

    return (
      <section key={instanceNode.id} className="instance-hierarchy">
        <h3>
          {capitalize(type)} &quot;{instanceNode.name}&quot;
        </h3>
        <h4>Children</h4>
        {this.renderChildren()}
        <h4>Parent</h4>
        {this.renderParent()}
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
