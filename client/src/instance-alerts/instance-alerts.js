// @flow

import React, {Component} from 'react';
import {dispatchSet, watch} from 'redux-easy';

import Alert from '../alert/alert';
import {getJson} from '../util/rest-util';

import type {
  AlertType,
  NodeMapType,
  UiType
} from '../types';

import './instance-alerts.css';

type PropsType = {
  alerts: AlertType[],
  instanceNodeMap: NodeMapType,
  ui: UiType
};

/*
async function getAlerts(node: NodeType): Promise<AlertType[]> {
  const node = this.getNode();
  if (!node) return Promise.resolve([]);

  const json = await getJson(`alerts/${node.id}`);
  return ((json: any): AlertType[]);
}
*/

async function getAllAlerts(): Promise<AlertType[]> {
  const json = await getJson('alerts');
  return ((json: any): AlertType[]);
}

export async function reloadAlerts() {
  const alerts = await getAllAlerts();
  dispatchSet('alerts', alerts);
}

class InstanceAlerts extends Component<PropsType> {
  alertIsFor(instanceId: number, alertInstanceId: number) {
    if (alertInstanceId === instanceId) return true;

    const {instanceNodeMap} = this.props;
    const node = instanceNodeMap[instanceId];
    const {children} = node;
    return children.some(childId => this.alertIsFor(childId, alertInstanceId));
  }

  componentDidMount() {
    reloadAlerts();
  }

  getNode() {
    const {instanceNodeMap, ui} = this.props;
    return instanceNodeMap[ui.selectedChildNodeId];
  }

  render() {
    const {alerts} = this.props;
    if (!alerts || alerts.length === 0) {
      return <div>none</div>;
    }

    const {id} = this.getNode();
    const myAlerts = alerts.filter(alert =>
      this.alertIsFor(id, alert.instanceId)
    );

    return (
      <section className="instance-alerts">
        <div className="heading">Alerts</div>
        {myAlerts.map(alert => <Alert key={alert.name} alert={alert} />)}
      </section>
    );
  }
}

export default watch(InstanceAlerts, {
  alerts: '',
  instanceNodeMap: '',
  ui: ''
});
