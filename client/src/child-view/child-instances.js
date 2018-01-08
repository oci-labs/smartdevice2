// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import Button from '../share/button';
import {showModal} from '../share/sd-modal';
import type {NodeType, StateType} from '../types';
import {getJson} from '../util/rest-util';

import './child-instances.css';

type PropsType = {
  node: NodeType,
  typeName: string
};

function getAlerts(node: NodeType) {
  return getJson(`alerts/${node.id}`);
}

function getData(node: NodeType) {
  return getJson(`instances/${node.id}/data`);
}

function getType(node: NodeType): Promise<NodeType> {
  const {typeId} = node;
  if (!typeId) {
    throw new Error(`instance ${node.name} has no type id`);
  }

  const json = getJson(`type/${typeId}`);
  return ((json: any): Promise<NodeType>);
}

class ChildInstances extends Component<PropsType> {

  async componentWillReceiveProps(nextProps: PropsType) {
    const {node} = nextProps;
    if (!node) return;

    const type = await getType(node);
    console.log('child-instances.js componentWillReceiveProps: type =', type);
    dispatch('setTypeName', type.name);

    const alerts = await getAlerts(node);
    dispatch('setInstanceAlerts', alerts);
    console.log('child-view.js componentWillReceiveProps: alerts =', alerts);

    const data = await getData(node);
    dispatch('setInstanceData', data);
    console.log('child-view.js componentWillReceiveProps: data =', data);
  }

  editProperties = () => {
    const {node} = this.props;

    const renderFn = () => (
      <div>
        Editor goes here!
      </div>
    );

    showModal(node.name + ' Properties', '', renderFn);
  };

  renderGuts = () => {
    const {node, typeName} = this.props;
    if (!node) return null;

    console.log('child-instances.js renderGuts: node =', node);
    return (
      <div>
        <div className="node-name">
          {typeName} {node.name}
          <Button
            className="edit-properties"
            icon="cog"
            onClick={() => this.editProperties()}
            tooltip="edit properties"
          />
        </div>
        <h3>Alerts</h3>
        {/* Iterate over alerts in Redux. */}
      </div>
    );
  };

  render() {
    return (
      <section className="child-instances">
        <h3>Child View</h3>
        {this.renderGuts()}
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {instanceNodeMap, ui} = state;
  const {selectedChildNodeId, typeName} = ui;
  const node = instanceNodeMap[selectedChildNodeId];
  return {node, typeName};
};

export default connect(mapState)(ChildInstances);
