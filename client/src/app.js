// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import LeftNav from './left-nav/left-nav';
import ParentView from './parent-view/parent-view';
import ChildView from './child-view/child-view';

import type {StateType} from './types';

import './app.css';

type PropsType = {};

class App extends Component<PropsType> {

  render() {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">SmartDevice</h1>
        </header>
        <section id="body">
          <LeftNav />
          <ParentView />
          <ChildView />
        </section>
      </div>
    );
  }
}

const mapState = (state: StateType): Object => {
  const {
    instanceNodeMap,
    typeNodeMap,
    ui,
    user: {subscriptions}
  } = state;
  return {
    instanceNodeMap,
    subscriptions,
    typeNodeMap,
    ui
  };
};

export default connect(mapState)(App);
