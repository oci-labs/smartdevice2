// @flow

import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import Button from '../share/button';
import {showModal} from '../share/sd-modal';
import type {
  NodeType,
  PropertyKindType,
  PropertyType,
  StateType
} from '../types';
import {getJson} from '../util/rest-util';

import './child-instances.css';

type PropsType = {
  node: NodeType,
  typeName: string
};

type MyStateType = {
  typeProps: PropertyType[]
};

function getAlerts(node: NodeType) {
  return getJson(`alerts/${node.id}`);
}

function getData(node: NodeType) {
  return getJson(`instances/${node.id}/data`);
}

function getInput(type: PropertyKindType, value: string) {
  return type === 'boolean' ? (
    <input type="checkbox" onChange={() => {}} value={value} />
  ) : type === 'number' ? (
    <input type="number" onChange={() => {}} value={value} />
  ) : type === 'text' ? (
    <input type="text" onChange={() => {}} value={value} />
  ) : (
    <div>{`unsupported type ${type}`}</div>
  );
}

function getType(node: NodeType): Promise<NodeType> {
  const {typeId} = node;
  if (!typeId) {
    throw new Error(`instance ${node.name} has no type id`);
  }

  const json = getJson(`type/${typeId}`);
  return ((json: any): Promise<NodeType>);
}

function renderTableHead() {
  return (
    <thead>
      <tr>
        <th>Property</th>
        <th>Value</th>
      </tr>
    </thead>
  );
}

function renderTableRow(node: NodeType, property: PropertyType) {
  console.log('child-instances.js renderTableRow: node =', node);
  console.log('child-instances.js renderTableRow: property =', property);
  const value = node[property.name];
  console.log('child-instances.js renderTableRow: value =', value);
  return (
    <tr key={property.id}>
      <td>
        <label>{property.name}</label>
      </td>
      <td>{getInput(property.kind, value)}</td>
    </tr>
  );
}

class ChildInstances extends Component<PropsType, MyStateType> {
  state: MyStateType = {
    typeProps: []
  };

  async componentWillReceiveProps(nextProps: PropsType) {
    const {node} = nextProps;
    if (!node) return;

    const type = await getType(node);
    dispatch('setTypeName', type.name);
    this.loadTypeProps(type);

    const alerts = await getAlerts(node);
    dispatch('setInstanceAlerts', alerts);

    const data = await getData(node);
    dispatch('setInstanceData', data);
  }

  editProperties = () => {
    const {typeProps} = this.state;
    const {node} = this.props;

    const renderFn = () => (
      <table>
        {renderTableHead()}
        <tbody>
          {typeProps.map(typeProp => renderTableRow(node, typeProp))}
        </tbody>
      </table>
    );

    showModal(node.name + ' Properties', '', renderFn);
  };

  async loadTypeProps(typeNode: ?NodeType) {
    if (!typeNode) return;

    const json = await getJson(`types/${typeNode.id}/data`);
    const properties = ((json: any): PropertyType[]);
    const sortedProperties = sortBy(properties, ['name']);
    this.setState({typeProps: sortedProperties});
  }

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
