import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {reduxSetup} from 'redux-easy';

import App from './App';
import initialState from './initial-state';

it('renders without crashing', () => {
  const store = reduxSetup({initialState, mock: true});
  const div = document.createElement('div');
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    div);
});
