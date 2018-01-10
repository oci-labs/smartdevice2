// @flow

import React, {Component} from 'react';

import type {AlertType} from '../types';

import './alert.css';

type PropsType = {
  alert: AlertType
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

  render() {
    const {alert} = this.props;
    return (
      <div className="alert" key={alert.name}>
        {alert.name}:{' '}
        {formatTimestamp(alert.timestamp)}
      </div>
    );
  }
}

export default Alert;
