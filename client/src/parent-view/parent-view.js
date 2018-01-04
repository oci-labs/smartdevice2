// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
//import {dispatch} from 'redux-easy';

import type {NodeType, StateType} from '../types';

import './parent-view.css';

type PropsType = {
  instanceNode: ?NodeType
};

class ParentView extends Component<PropsType> {
  render() {
    const {instanceNode} = this.props;
    return (
      <section className="parent-view">
        <h3>Parent View</h3>
        {instanceNode ? (
          <div>You selected {instanceNode.name}.</div>
        ) : (
          <div>Select an instance from the left nav.</div>
        )}
      </section>
    );
  }
}

const mapState = (state: StateType): Object => {
  const {instanceNodeMap, ui} = state;
  const {selectedInstanceNodeId} = ui;
  const instanceNode = instanceNodeMap[selectedInstanceNodeId];
  return {instanceNode};
};

export default connect(mapState)(ParentView);
