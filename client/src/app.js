// @flow

import React, {Component} from 'react';
import {watch} from 'redux-easy';

import Enums from './enums/enums';
import Header from './header/header';
import InstanceHierarchy from './instance-hierarchy/instance-hierarchy';
import LeftNav from './left-nav/left-nav';
import MessageServers from './message-servers/message-servers';
import SdModal from './share/sd-modal';
import TrainControl from './train-control/train-control';
import TypeDefinitions from './type-definitions/type-definitions';
import UserDropdown from './user-dropdown/user-dropdown';

import type {ViewType} from './types';

import './app.css';

type PropsType = {
  view: ViewType
};

const rightMap = {
  //'': null,
  '': <TrainControl />,
  enum: <Enums />,
  instance: <InstanceHierarchy />,
  server: <MessageServers />,
  type: <TypeDefinitions />
};

/*
const rightMap = {
  '': null,
  instance: <InstanceDetail />,
  type: <TypeAlerts />
};
*/

const hasLeftNav = view => view === 'instance' || view === 'type';

class App extends Component<PropsType> {
  render() {
    const {view} = this.props;
    return (
      <div className="app">
        <Header />
        <UserDropdown />
        <section id="body">
          {hasLeftNav(view) && <LeftNav />}
          {rightMap[view]}
        </section>
        <SdModal />
      </div>
    );
  }
}

export default watch(App, {view: 'ui.view'});
