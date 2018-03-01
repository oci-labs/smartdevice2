// @flow

import React, {Component} from 'react';
import {watch} from 'redux-easy';

import Enums from './enums/enums';
import Header from './header/header';
import InstanceDetail from './instance-detail/instance-detail';
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
  '': null,
  Enums: <Enums />,
  Instances: <InstanceDetail />,
  Servers: <MessageServers />,
  'Train Control': <TrainControl />,
  Types: <TypeDefinitions />
};

const hasLeftNav = view => view === 'Instances' || view === 'Types';

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
