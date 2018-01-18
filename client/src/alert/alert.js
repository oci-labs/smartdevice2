// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import {deleteResource} from '../util/rest-util';

import type {AlertType, NodeMapType, StateType} from '../types';

import './alert.css';

type PropsType = {
  alert?: AlertType,
  instanceNodeMap: NodeMapType,
  typeNodeMap: NodeMapType
};

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  let hour = date.getHours();
  const amPm = hour < 12 ? 'am' : 'pm';
  if (hour > 12) hour -= 12;
  const minute = date.getMinutes();
  return `${month}/${day} - ${hour}:${pad2(minute)} ${amPm}`;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

class Alert extends Component<PropsType> {
  deleteAlert = () => {
    const {alert} = this.props;
    if (!alert) return;

    deleteResource('alert/' + alert.id);
    dispatch('deleteAlert', alert.id);
  };

  handleDoubleClick = () => {
    const {alert} = this.props;
    if (!alert) return;
    dispatch('setSelectedChildNodeId', alert.instanceId);
  };

  render() {
    const {alert, instanceNodeMap, typeNodeMap} = this.props;
    if (!alert) return null;

    // Get the type name for instance associated with this alert.
    const {instanceId} = alert;
    const instance = instanceNodeMap[instanceId];
    const {typeId} = instance;
    let typeName = 'unknown';
    if (typeId) {
      const typeNode = typeNodeMap[typeId];
      if (typeNode) typeName = typeNode.name;
    }

    return (
      <div
        className="alert"
        key={alert.id}
        onDoubleClick={this.handleDoubleClick}
      >
        <div className="line1">
          {typeName} {instance.name} ({instanceId})
          <div className="delete" onClick={this.deleteAlert}>
            &#10005;
          </div>
        </div>
        <div className="line2">
          {alert.name}: {formatTimestamp(alert.timestamp)}
        </div>
      </div>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {instanceNodeMap, typeNodeMap} = state;
  return {instanceNodeMap, typeNodeMap};
};

export default connect(mapState)(Alert);
