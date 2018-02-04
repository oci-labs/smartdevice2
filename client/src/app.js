// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import Header from './header/header';
import InstanceDetail from './instance-detail/instance-detail';
import InstanceHierarchy from './instance-hierarchy/instance-hierarchy';
import LeftNav from './left-nav/left-nav';
import SdModal from './share/sd-modal';
import TrainControl from './train-control/train-control';
import TypeAlerts from './type-alerts/type-alerts';
import TypeProperties from './type-properties/type-properties';

import type {StateType, TreeType} from './types';

import './app.css';

type PropsType = {
  treeType: TreeType
};

const middleMap = {
  //'': null,
  '': <TrainControl />,
  instance: <InstanceHierarchy />,
  type: <TypeProperties />
};

const rightMap = {
  '': null,
  instance: <InstanceDetail />,
  type: <TypeAlerts />
};

class App extends Component<PropsType> {
  render() {
    const {treeType} = this.props;
    return (
      <div className="app">
        <Header />
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
