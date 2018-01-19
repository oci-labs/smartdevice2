// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet} from 'redux-easy';

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

  render() {
    const {treeType} = this.props;
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">Open Edge Device Management</h1>
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
