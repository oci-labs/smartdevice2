// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import Button from '../share/button';
import ImportExport from '../import-export/import-export';
import {showModal} from '../share/sd-modal';
import {post} from '../util/rest-util';

import type {StateType} from '../types';

import './header.css';

type PropsType = {
  mqttConnected: boolean
};

class Header extends Component<PropsType> {
  importExport = () => {
    const renderFn = () => <ImportExport />;
    showModal({title: 'Import/Export JSON Schema', renderFn});
  };

  refresh = () => post('mqtt/feedback');

  render() {
    const {mqttConnected} = this.props;
    const heartIcon = mqttConnected ? 'heartbeat' : 'heart-o';
    const messageBrokerStatus = mqttConnected ? 'connected' : 'not running';
    return (
      <header className="header">
        <img className="logo" alt="OCI logo" src="images/oci-logo.svg" />
        <div className="title">Devo</div>
        <div className="right">
          <span
            className={`fa fa-2x fa-${heartIcon}`}
            title={`message broker is ${messageBrokerStatus}`}
          />
          <Button
            className="refresh-btn fa-2x"
            icon="refresh"
            onClick={() => this.refresh()}
            tooltip="import/export"
          />
          <Button
            className="import-export-btn fa-2x"
            icon="cog"
            onClick={() => this.importExport()}
            tooltip="import/export"
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
