// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet} from 'redux-easy';

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
  componentWillMount() {
    // Start on "Servers" tab in left nav on refresh.
    dispatchSet('ui.treeType', '');
  }

  importExport = () => {
    const renderFn = () => <ImportExport />;
    showModal({title: 'Import/Export JSON', renderFn});

    console.log('app.js importExport: entered');
  };

  render() {
    const {treeType} = this.props;
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">
            Open Edge Device Management
            <Button
              className="import-export-btn"
              icon="cog"
              onClick={() => this.importExport()}
              tooltip="import/export"
            />
          </h1>
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
