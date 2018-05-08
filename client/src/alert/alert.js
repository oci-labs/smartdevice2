// @flow

import React, {Component} from 'react';
import {dispatch, watch} from 'redux-easy';

import {deleteResource} from '../util/rest-util';

import type {AlertType, NodeMapType} from '../types';

import './alert.css';

type PropsType = {
  alert?: AlertType,
  instanceNodeMap: NodeMapType,
  typeNodeMap: NodeMapType
};

const PRIORITIES = ['', 'info', 'low', 'medium', 'high'];

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

    console.log('alert.js render: alert =', alert);

    // Get the type name for instance associated with this alert.
    const {instanceId} = alert;
    const instance = instanceNodeMap[instanceId];
    const {typeId} = instance;
    let typeName = 'unknown';
    if (typeId) {
      const typeNode = typeNodeMap[typeId];
      if (typeNode) typeName = typeNode.name;
    }

    const classes = ['alert'];
    if (alert.sticky) classes.push('sticky');
    alert.priority ? classes.push(PRIORITIES[alert.priority]) : classes.push('info');

    return (
      <div
        className={classes.join(' ')}
        key={alert.id}
        onDoubleClick={this.handleDoubleClick}
      >
        <div className="line1">
          {typeName} {instance.name} ({instanceId})
          <div
            className="close fa fa-2x fa-times-circle"
            onClick={this.deleteAlert}
          />
        </div>
        <div className="line2">
          {alert.name}: {formatTimestamp(alert.timestamp)}
        </div>
      </div>
    );
  }
}

export default watch(Alert, {instanceNodeMap: '', typeNodeMap: ''});
