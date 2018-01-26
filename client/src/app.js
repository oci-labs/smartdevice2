// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import ImportExport from './import-export/import-export';
import InstanceDetail from './instance-detail/instance-detail';
import InstanceHierarchy from './instance-hierarchy/instance-hierarchy';
import LeftNav from './left-nav/left-nav';
import Button from './share/button';
import SdModal, {showModal} from './share/sd-modal';
import TypeAlerts from './type-alerts/type-alerts';
import TypeProperties from './type-properties/type-properties';

import type {StateType, TreeType} from './types';

import './app.css';

type PropsType = {
  treeType: TreeType
};

const middleMap = {
  '': null,
  instance: <InstanceHierarchy />,
  type: <TypeProperties />
};

const rightMap = {
  '': null,
  instance: <InstanceDetail />,
  type: <TypeAlerts />
};

class App extends Component<PropsType> {
  importExport = () => {
    const renderFn = () => <ImportExport />;
    showModal({title: 'Import/Export JSON Schema', renderFn});
  };

  render() {
    const {treeType} = this.props;
    return (
      <div className="app">
        <header>
          <img className="logo" alt="OCI logo" src="images/oci-logo.svg" />
          <div className="title">Devo</div>
          <div className="right">
            {/* <span className="fa fa-2x fa-heartbeat" /> */}
            <Button
              className="import-export-btn fa-2x"
              icon="cog"
              onClick={() => this.importExport()}
              tooltip="import/export"
            />
          </div>
        </header>
        <section id="body">
          <LeftNav />
          {middleMap[treeType]}
          {rightMap[treeType]}
        </section>
        <SdModal />
      </div>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {treeType} = state.ui;
  return {treeType};
};

export default connect(mapState)(App);
