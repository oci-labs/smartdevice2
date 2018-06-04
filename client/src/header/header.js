// @flow

import React, {Component} from 'react';
import {dispatchSet, watch} from 'redux-easy';

import Button from '../share/button';
import {post} from '../util/rest-util';
import {send} from '../websocket';

import './header.css';

type PropsType = {
  mqttConnected: boolean,
  openDdsSecure: boolean
};

class Header extends Component<PropsType> {
  refresh = () => post('mqtt/feedback');

  toggleSecure = () =>
    send(
      `OpenDDS reconnect ${this.props.openDdsSecure ? 'insecure' : 'secure'}`
    );

  showUserDropdown = event => {
    event.stopPropagation();
    dispatchSet('ui.showUserDropdown', true);
  };

  render() {
    const {mqttConnected, openDdsSecure = false} = this.props;
    const heartIcon = mqttConnected ? 'heartbeat' : 'heart-o';
    const lockIcon = openDdsSecure ? 'lock' : 'unlock';
    const secureStatus = openDdsSecure ? 'secured' : 'not secured';
    const messageBrokerStatus = mqttConnected ? 'connected' : 'not running';
    return (
      <header className={openDdsSecure ? 'header secure' : 'header'}>
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
            className={`fa-2x`}
            icon={lockIcon}
            // onClick={() => this.toggleSecure()}
            tooltip={`OpenDDs is ${secureStatus}`}
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

export default watch(Header, {mqttConnected: '', openDdsSecure: ''});
