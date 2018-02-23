// @flow

import {dispatch, dispatchSet, getState} from 'redux-easy';

import {reloadAlerts} from './instance-detail/instance-detail';
import {getInstanceNode, getTypeNode} from './util/node-util';

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
      const [, word, count] = data.split(' ');
      if (word === 'attempts') {
        dispatchSet('mqttConnectionAttempts', Number(count));
      } else {
        const connected = word === 'connected';
        dispatchSet('mqttConnected', connected);
        dispatchSet('mqttConnectionAttempts', 0);
      }
      return;
    }

    if (data === 'reload alerts') {
      reloadAlerts();
      return;
    }

    try {
      // $FlowFixMe - doesn't think data is a string
      const change = JSON.parse(data);
      const {instanceId, value} = change;

      const {selectedInstanceNodeId} = getState().ui;
      if (instanceId === selectedInstanceNodeId) {
        dispatch('setInstanceProperty', change);
      }

      // Train-specific code
      if (isTrainProperty(instanceId)) {
        let trainProperty = getTrainProperty(change);
        if (trainProperty) {
          if (trainProperty === 'detected.power') {
            const instanceNode = getInstanceNode(instanceId);
            const typeNode = getTypeNode(instanceNode);
            if (typeNode.name === 'lights') {
              trainProperty = 'detected.lightPower';
            }
          }

          const scaledValue =
            trainProperty === 'detected.lightCalibration'
              ? 256 * value / 100
              : value;
          dispatchSet('trainControl.' + trainProperty, scaledValue);
        }
      }
    } catch (e) {
      console.error('websocket.js: e =', e);
      console.info('unsupported WebSocket message:', data);
    }
  };

  ws.onopen = () => console.info('got WebSocket connection');
}

function getTrainProperty(change) {
  const {property} = change;
  if (property === 'ambient') return 'detected.light';
  if (property === 'power') return 'detected.power';
  if (property === 'calibration') {
    const {instanceId} = change;
    const instanceNode = getInstanceNode(instanceId);
    const typeNode = getTypeNode(instanceNode);
    const {name} = typeNode;
    return name === 'engine'
      ? 'detected.idleCalibration'
      : name === 'lights' ? 'detected.lightCalibration' : null;
  }
  if (property === 'lifecycle') return 'trainAlive';
}

function isTrainProperty(instanceId: number): boolean {
  const instanceNode = getInstanceNode(instanceId);
  if (!instanceNode) return false;
  const typeNode = getTypeNode(instanceNode);
  if (typeNode.name === 'train') return true;

  const {parentId} = instanceNode;
  return parentId ? isTrainProperty(parentId) : false;
}

export function send(message: string): void {
  if (ws) ws.send(message);
}

export function websocketSetup() {
  const {hostname} = window.location;
  ws = new WebSocket(`ws://${hostname}:1337`);
  configure(ws);
}
