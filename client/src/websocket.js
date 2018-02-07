// @flow

import {dispatch, dispatchSet} from 'redux-easy';

import {reloadAlerts} from './instance-detail/instance-detail';

let ws;

function configure(ws) {
  ws.onclose = () => {
    console.info('got WebSocket close');
    // Try to get a new WebSocket connection in 5 seconds.
    setTimeout(websocketSetup, 5000);
  };

  /*
  ws.onerror = error =>
    console.error('WebSocket error:', error);
  */

  ws.onmessage = message => {
    const data = String(message.data);

    if (data.startsWith('MQTT ')) {
      const connected = data.endsWith('connected');
      dispatchSet('mqttConnected', connected);
      return;
    }

    if (data === 'reload alerts') {
      reloadAlerts();
      return;
    }

    try {
      // $FlowFixMe - doesn't think data is a string
      const change = JSON.parse(data);
      //console.log('websocket.js onmessage: change =', change);
      dispatch('setInstanceProperty', change);
    } catch (e) {
      console.info('unsupported WebSocket message:', data);
    }
  };

  ws.onopen = () => console.info('got WebSocket connection');
}

export function send(message: string): void {
  if (ws) ws.send(message);
}

export function websocketSetup() {
  const {hostname} = window.location;
  ws = new WebSocket(`ws://${hostname}:1337`);
  configure(ws);
}
