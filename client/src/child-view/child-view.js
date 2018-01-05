// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import type {NodeType, StateType} from '../types';
import {OK, handleError} from '../util/error-util';
import {getUrlPrefix} from '../util/rest-util';

import './child-view.css';

type PropsType = {
  node: NodeType
};

const URL_PREFIX = getUrlPrefix();

async function getAlerts(node: NodeType) {
  const url = `${URL_PREFIX}alerts/${node.id}`;
  const options = {method: 'GET'};
  const res = await fetch(url, options);
  if (res.status !== OK) {
    return handleError(res.statusText);
  }

  const alerts = await res.json();
  return alerts;
}

async function getData(node: NodeType) {
  const url = `${URL_PREFIX}instances/${node.id}/data`;
  const options = {method: 'GET'};
  const res = await fetch(url, options);
  if (res.status !== OK) {
    return handleError(res.statusText);
  }

  const data = await res.json();
  return data;
}

class ChildView extends Component<PropsType> {

  async componentWillReceiveProps(nextProps: PropsType) {
    const {node} = nextProps;
    console.log('child-view.js x: node =', node);
    if (!node) return;

    const alerts = await getAlerts(node);
    //TODO: Put these in Redux.
    console.log('child-view.js componentWillReceiveProps: alerts =', alerts);

    const data = await getData(node);
    //TODO: Put these in Redux.
    console.log('child-view.js componentWillReceiveProps: data =', data);
  }

  renderGuts = () => {
    const {node} = this.props;
    if (!node) return null;

    return (
      <div>
        <div className="node-name">{node.name}</div>
        <h3>Alerts</h3>
        {/* Iterate over alerts in Redux. */}
      </div>
    );
  };

  render() {
    return (
      <section className="child-view">
        <h3>Child View</h3>
        {this.renderGuts()}
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {instanceNodeMap, ui} = state;
  const {selectedChildNodeId} = ui;
  const node = instanceNodeMap[selectedChildNodeId];
  return {node};
};

export default connect(mapState)(ChildView);
