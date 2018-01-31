// @flow

import capitalize from 'lodash/capitalize';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';
import {getType} from '../tree/tree-util';

import type {AlertType, NodeMapType, NodeType, StateType} from '../types';

import './node.css';

type PropsType = {
  alerts: AlertType[],
  instanceNodeMap: NodeMapType,
  isSelected?: boolean,
  node?: NodeType
};

export function getAlertCount(
  node: NodeType,
  instanceNodeMap: NodeMapType,
  alerts: AlertType[]
): number {
  if (!node) return 0;

  const {children, id} = node;

  // Get the number of alerts for this node.
  const alertCount = alerts
    ? alerts.filter(alert => alert.instanceId === id).length
    : 0;

  // Get the number of alerts for
  // all the children of this node.
  const childrenAlertCount = children.reduce((sum, id) => {
    const child = instanceNodeMap[id];
    return sum + getAlertCount(child, instanceNodeMap, alerts);
  }, 0);

  return alertCount + childrenAlertCount;
}

class Node extends Component<PropsType> {
  select = () => {
    const {node} = this.props;
    if (node) dispatch('setSelectedChildNodeId', node.id);
  };

  render() {
    const {alerts, instanceNodeMap, isSelected, node} = this.props;
    if (!node) return null;

    let className = 'node';
    if (isSelected) className += ' selected';

    const alertCount = getAlertCount(node, instanceNodeMap, alerts);

    return (
      <div className={className} onClick={this.select}>
        <div className="circle">
          {node.name}
          <div className="badge">{alertCount}</div>
        </div>
        {capitalize(getType(node))}
      </div>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {alerts, instanceNodeMap} = state;
  return {alerts, instanceNodeMap};
};

export default connect(mapState)(Node);
