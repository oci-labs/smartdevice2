// @flow

import {dispatch, dispatchSet, getState} from 'redux-easy';

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
      const {instanceId, value} = change;

      const {selectedInstanceNodeId} = getState().ui;
      if (instanceId === selectedInstanceNodeId) {
        dispatch('setInstanceProperty', change);
      }

      // Train-specific code
      if (isTrainProperty(instanceId)) {
        const trainProperty = getTrainProperty(change);
        if (trainProperty) {
          const scaledValue =
            trainProperty === 'detectedLightCalibration'
              ? 256 * value / 100
              : value;
          dispatchSet('trainControl.' + trainProperty, scaledValue);
        }
      }
    } catch (e) {
      console.info('unsupported WebSocket message:', data);
    }
  };

  ws.onopen = () => console.info('got WebSocket connection');
}

function getInstanceNode(instanceId) {
  const {instanceNodeMap} = getState();
  return instanceNodeMap[instanceId];
}

function getTrainProperty(change) {
  const {property} = change;
  if (property === 'ambient') return 'detectedLight';
  if (property === 'power') return 'detectedPower';
  if (property === 'calibration') {
    const {instanceId} = change;
    const instanceNode = getInstanceNode(instanceId);
    const typeNode = getTypeNode(instanceNode);
    const {name} = typeNode;
    return name === 'engine'
      ? 'detectedIdleCalibration'
      : name === 'lights' ? 'detectedLightCalibration' : null;
  }
}

function getTypeNode(instanceNode) {
  const {typeNodeMap} = getState();
  return typeNodeMap[instanceNode.typeId];
}

function isTrainProperty(instanceId: number): boolean {
  const instanceNode = getInstanceNode(instanceId);
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
