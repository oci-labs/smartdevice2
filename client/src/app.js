import React, {Component} from 'react';
import TreeBuilder from './tree-builder';

import './app.css';

class App extends Component {
  render() {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">SmartDevice</h1>
        </header>
        <TreeBuilder />
      </div>
    );
  }
}

export default App;
