// @flow

import capitalize from 'lodash/capitalize';
import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {watch} from 'redux-easy';

import Node from '../node/node';
import {getType} from '../tree/tree-util';
import type {NodeMapType, NodeType, UiType} from '../types';

import './instance-hierarchy.css';

type PropsType = {
  instanceNodeMap: NodeMapType,
  ui: UiType
};

class ParentInstances extends Component<PropsType> {
  getInstanceNode = () => {
    const {instanceNodeMap, ui} = this.props;
    return instanceNodeMap[ui.selectedInstanceNodeId];
  }

  renderChild = (child: NodeType) => {
    const {selectedChildNodeId} = this.props.ui;
    const isSelected = child.id === selectedChildNodeId;
    return <Node key={child.id} isSelected={isSelected} node={child} />;
  };

  renderChildren = () => {
    const instanceNode = this.getInstanceNode();
    if (!instanceNode) return;

    const {children} = instanceNode;
    if (children.length === 0) return <div>none</div>;

    const {instanceNodeMap} = this.props;
    const childNodes = children.map(id => instanceNodeMap[id]);
    const sortedChildren = sortBy(childNodes, ['name']);
    return sortedChildren.map(child => this.renderChild(child));
  };

  renderParent = () => {
    const instanceNode = this.getInstanceNode();
    if (!instanceNode) return;

    const {parentId} = instanceNode;
    if (!parentId) return <div>none</div>;

    const {instanceNodeMap, ui} = this.props;
    const parent = instanceNodeMap[parentId];
    if (!parent || parent.name === 'root') return <div>none</div>;

    const isSelected = parent.id === ui.selectedChildNodeId;
    return <Node isSelected={isSelected} node={parent} />;
  };

  render() {
    const instanceNode = this.getInstanceNode();
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

export default watch(ParentInstances, {
  instanceNodeMap: '',
  ui: ''
});
