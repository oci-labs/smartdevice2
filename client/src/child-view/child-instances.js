// @flow

import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import Button from '../share/button';
import {getJson, postJson} from '../util/rest-util';
import {hideModal, showModal} from '../share/sd-modal';

import type {
  InstanceDataType,
  NodeType,
  PrimitiveType,
  PropertyType,
  StateType
} from '../types';

import './child-instances.css';

type PropsType = {
  instanceData: Object,
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

class ChildInstances extends Component<PropsType, MyStateType> {
  state: MyStateType = {
    typeProps: []
  };

  async componentWillReceiveProps(nextProps: PropsType) {
    const {node} = nextProps;
    if (!node) return;

    // If the same node has already been processed ...
    const prevNode = this.props.node;
    if (prevNode && node.id === prevNode.id) return;

    const type = await getType(node);
    dispatch('setTypeName', type.name);
    this.loadTypeProps(type);

    const alerts = await getAlerts(node);
    dispatch('setInstanceAlerts', alerts);

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

  editProperties = () => {
    const {typeProps} = this.state;
    const {node} = this.props;

    const renderFn = () => (
      <div className="child-instances-modal">
        <table>
          {renderTableHead()}
          <tbody>
            {typeProps.map(typeProp => this.renderTableRow(node, typeProp))}
          </tbody>
        </table>
        <Button
          className="edit-properties"
          label="Save"
          onClick={() => this.saveProperties()}
          tooltip="save properties"
        />
      </div>
    );

    showModal(node.name + ' Properties', '', renderFn);
  };

  getInput = (property: PropertyType, value: PrimitiveType) => {
    const {kind, name} = property;

    const onChange = event => {
      const {instanceData} = this.props;
      const {checked, value} = event.target;
      const v = kind === 'boolean' ? checked : value;
      const newInstanceData = {...instanceData, [name]: v};
      dispatch('setInstanceData', newInstanceData);
    };

    return kind === 'boolean' ? (
      <input type="checkbox" onChange={onChange} checked={value} />
    ) : kind === 'number' ? (
      <input type="number" onChange={onChange} value={value} />
    ) : kind === 'text' ? (
      <input type="text" onChange={onChange} value={value} />
    ) : (
      <div>{`unsupported type ${kind}`}</div>
    );
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

  renderTableRow = (node: NodeType, property: PropertyType) => {
    const {name} = property;
    const {instanceData} = this.props;
    const value = instanceData[name];

    return (
      <tr key={property.id}>
        <td>
          <label>{name}</label>
        </td>
        <td>{this.getInput(property, value)}</td>
      </tr>
    );
  };

  saveProperties = async () => {
    const {instanceData, node} = this.props;
    console.log(
      'child-instances.js saveProperties: instanceData =',
      instanceData
    );
    await postJson(`instances/${node.id}/data`, instanceData);
    // Clear the instance data.  Is this needed?
    dispatch('setInstanceData', {});

    hideModal();
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
  const {instanceData, instanceNodeMap, ui} = state;
  const {selectedChildNodeId, typeName} = ui;
  const node = instanceNodeMap[selectedChildNodeId];
  return {instanceData, node, typeName};
};

export default connect(mapState)(ChildInstances);
