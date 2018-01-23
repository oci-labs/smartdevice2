// @flow
import 'font-awesome/css/font-awesome.min.css';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {reduxSetup} from 'redux-easy';

import App from './app';
import initialState from './initial-state';
import {getElementById} from './util/flow-util';
import {websocketSetup} from './websocket';
import './reducers';

import './index.css';

const store = reduxSetup({initialState, render});

function render() {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    getElementById('root')
  );
}

websocketSetup();
render();
