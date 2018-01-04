// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';

import type {NodeType, StateType} from '../types';
import {OK, handleError} from '../util/error-util';

import './child-view.css';

type PropsType = {
  node: NodeType
};

export const URL_PREFIX = 'http://localhost:3001/';

class ChildView extends Component<PropsType> {

  async componentWillReceiveProps(nextProps: PropsType) {
    const {node} = nextProps;
    console.log('child-view.js x: node =', node);
    if (!node) return;

    const url = `${URL_PREFIX}alerts/${node.id}`;
    const options = {method: 'GET'};
    const res = await fetch(url, options);
    if (res.status === OK) {
      const alerts = await res.json();
      console.log('child-view.js x: alerts =', alerts);
      //TODO: Put these in Redux.
    } else {
      handleError(res.statusText);
    }
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
