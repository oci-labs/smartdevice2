// @flow
import 'font-awesome/css/font-awesome.min.css';
import React from 'react';
import {reduxSetup} from 'redux-easy';

import App from './app';
import initialState from './initial-state';
import {websocketSetup} from './websocket';
import './reducers';

import './index.css';

//TODO: This is the reset logic that should be
//TODO: executed when the connection is lost.
const {trainControl} = initialState;
const {defaults} = trainControl;
trainControl.controlled = {...defaults};
trainControl.detected = {...defaults};

reduxSetup({component: <App />, initialState});

websocketSetup();
