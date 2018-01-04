// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
//import {dispatch} from 'redux-easy';

import type {NodeType, StateType} from '../types';

import './child-view.css';

type PropsType = {
  node: NodeType
};

class ChildView extends Component<PropsType> {
  renderGuts = () => {
    const {node} = this.props;
    if (!node) return null;

    return <div>{node.name}</div>;
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
