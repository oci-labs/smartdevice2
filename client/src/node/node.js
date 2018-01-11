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

class Node extends Component<PropsType> {
  getAlertCount = (node: NodeType): number => {
    const {children, id} = node;
    console.log('getAlertCount: node.name =', node.name);
    console.log('getAlertCount: id =', id);
    const {alerts, instanceNodeMap} = this.props;

    // Get the number of alerts for this node.
    const alertCount = alerts
      ? alerts.filter(alert => alert.instanceId === id).length
      : 0;
    console.log('getAlertCount: alertCount =', alertCount);

    // Get the number of alerts for
    // all the children of this node.
    const childrenAlertCount = children.reduce((sum, id) => {
      const child = instanceNodeMap[id];
      return sum + this.getAlertCount(child);
    }, 0);
    console.log('getAlertCount: childrenAlertCount =', childrenAlertCount);

    return alertCount + childrenAlertCount;
  };

  select = () => {
    const {node} = this.props;
    if (node) dispatch('setSelectedChildNodeId', node.id);
  };

  render() {
    const {isSelected, node} = this.props;
    if (!node) return null;
    console.log('render: node.name =', node.name);

    let className = 'node';
    if (isSelected) className += ' selected';

    const alertCount = this.getAlertCount(node);

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
