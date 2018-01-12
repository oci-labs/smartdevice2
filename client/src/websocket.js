// @flow

import {reloadAlerts} from './instance-detail/instance-detail';

export function websocketSetup() {
  const connection = new WebSocket('ws://127.0.0.1:1337');

  connection.onopen = () =>
    console.log('got WebSocket connection');

  connection.onerror = error =>
    console.error('WebSocket error:', error);

  connection.onmessage = message => {
    const {data} = message;
    //console.log('WebSocket message:', data);
    if (data === 'reload alerts') reloadAlerts();
  };
}
