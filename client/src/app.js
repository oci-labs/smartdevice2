// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import LeftNav from './left-nav/left-nav';
import InstanceDetail from './instance-detail/instance-detail';
import InstanceHierarchy from './instance-hierarchy/instance-hierarchy';
import TypeAlerts from './type-alerts/type-alerts';
import TypeProperties from './type-properties/type-properties';
import SdModal from './share/sd-modal';

import type {StateType, TreeType} from './types';

import './app.css';

type PropsType = {
  treeType: TreeType
};

class App extends Component<PropsType> {

  render() {
    const {treeType} = this.props;
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">SmartDevice</h1>
        </header>
        <section id="body">
          <LeftNav />

          {treeType === 'type' ? <TypeProperties /> : <InstanceHierarchy />}
          {treeType === 'type' ? <TypeAlerts /> : <InstanceDetail />}
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
