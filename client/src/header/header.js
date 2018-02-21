// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet} from 'redux-easy';

import Button from '../share/button';
import {post} from '../util/rest-util';

import type {StateType} from '../types';

import './header.css';

type PropsType = {
  mqttConnected: boolean
};

class Header extends Component<PropsType> {
  refresh = () => post('mqtt/feedback');

  showUserDropdown = () => dispatchSet('ui.showUserDropdown', true);

  render() {
    const {mqttConnected} = this.props;
    const heartIcon = mqttConnected ? 'heartbeat' : 'heart-o';
    const messageBrokerStatus = mqttConnected ? 'connected' : 'not running';
    return (
      <header className="header">
        <div className="left">
          <img className="logo" alt="OCI logo" src="images/oci-logo.svg" />
          <div className="title">Devo</div>
        </div>
        <div className="right">
          <span
            className={`fa fa-2x fa-${heartIcon}`}
            title={`message broker is ${messageBrokerStatus}`}
          />
          <Button
            className="refresh-btn fa-2x"
            icon="refresh"
            onClick={() => this.refresh()}
            tooltip="request latest data"
          />
          <Button
            className="user-btn fa-2x"
            icon="user"
            onClick={() => this.showUserDropdown()}
          />
        </div>
      </header>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {mqttConnected} = state;
  return {mqttConnected};
};

export default connect(mapState)(Header);
