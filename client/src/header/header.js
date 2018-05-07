// @flow

import React, {Component} from 'react';
import {dispatchSet, watch} from 'redux-easy';

import Button from '../share/button';
import {post} from '../util/rest-util';

import './header.css';

type PropsType = {
  mqttConnected: boolean
};

class Header extends Component<PropsType> {
  refresh = () => post('mqtt/feedback');

  showUserDropdown = event => {
    event.stopPropagation();
    dispatchSet('ui.showUserDropdown', true);
  };

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
            onClick={e => this.showUserDropdown(e)}
          />
        </div>
      </header>
    );
  }
}

export default watch(Header, {mqttConnected: ''});
