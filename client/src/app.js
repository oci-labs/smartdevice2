// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import Header from './header/header';
import InstanceDetail from './instance-detail/instance-detail';
import InstanceHierarchy from './instance-hierarchy/instance-hierarchy';
import LeftNav from './left-nav/left-nav';
import MessageServers from './message-servers/message-servers';
import SdModal from './share/sd-modal';
import TrainControl from './train-control/train-control';
import TypeAlerts from './type-alerts/type-alerts';
import TypeProperties from './type-properties/type-properties';
import UserDropdown from './user-dropdown/user-dropdown';

import type {StateType, ViewType} from './types';

import './app.css';

type PropsType = {
  view: ViewType
};

const rightMap = {
  //'': null,
  '': <TrainControl />,
  instance: <InstanceHierarchy />,
  server: <MessageServers />,
  type: <TypeProperties />
};

/*
const rightMap = {
  '': null,
  instance: <InstanceDetail />,
  type: <TypeAlerts />
};
*/

class App extends Component<PropsType> {
  render() {
    const {view} = this.props;
    return (
      <div className="app">
        <Header />
        <UserDropdown />
        <section id="body">
          <LeftNav />
          {rightMap[view]}
        </section>
        <SdModal />
      </div>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {view} = state.ui;
  return {view};
};

export default connect(mapState)(App);
