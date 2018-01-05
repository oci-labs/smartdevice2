// @flow

import React, {Component} from 'react';

import LeftNav from './left-nav/left-nav';
import ParentView from './parent-view/parent-view';
import ChildView from './child-view/child-view';
import SdModal from './share/sd-modal';

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
        <SdModal />
      </div>
    );
  }
}

export default App;
