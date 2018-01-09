// @flow

import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import PropertyForm from './property-form';
import Button from '../share/button';
import {getJson} from '../util/rest-util';
import {showModal} from '../share/sd-modal';

import type {
  InstanceDataType,
  NodeType,
  PropertyType,
  StateType
} from '../types';

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

  componentDidMount() {
    const {node} = this.props;
    this.loadData(node);
  }

  componentWillReceiveProps(nextProps: PropsType) {
    const {node} = nextProps;
    if (!node) return;

    // If the same node has already been processed ...
    const prevNode = this.props.node;
    if (prevNode && node.id === prevNode.id) return;

    this.loadData(node);
  }

  editProperties = () => {
    const {node} = this.props;
    const renderFn = () => <PropertyForm />;
    showModal(node.name + ' Properties', '', renderFn);
  };

  async loadData(node: NodeType) {
    const type = await getType(node);
    //dispatch('setTypeName', type.name);

    const alerts = await getAlerts(node);
    dispatch('setInstanceAlerts', alerts);

    this.loadTypeProps(type);

    this.loadInstanceData(node);
  }

  async loadInstanceData(node: NodeType) {
    const json = await getData(node);
    let data = ((json: any): InstanceDataType[]);
    // Change the shape of this data
    // from an array of InstanceDataType objects
    // to an object with key/value pairs (map).
    data = data.reduce((map, d) => {
      map[d.dataKey] = d.dataValue;
      return map;
    }, {});
    dispatch('setInstanceData', data);
  }

  async loadTypeProps(typeNode: ?NodeType) {
    if (!typeNode) return;

    const json = await getJson(`types/${typeNode.id}/data`);
    const properties = ((json: any): PropertyType[]);
    const sortedProperties = sortBy(properties, ['name']);
    dispatch('setTypeProps', sortedProperties);
  }

  renderGuts = () => {
    const {node, typeName} = this.props;
    if (!node) return null;

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
