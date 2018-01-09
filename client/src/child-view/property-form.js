// @flow

import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import Button from '../share/button';
import {getJson, postJson} from '../util/rest-util';
import {hideModal} from '../share/sd-modal';

import type {
  InstanceDataType,
  NodeType,
  PrimitiveType,
  PropertyType,
  StateType
} from '../types';

//import './property-form.css';

type PropsType = {
  instanceData: Object,
  node: NodeType,
  typeProps: PropertyType[]
};

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

class PropertyForm extends Component<PropsType> {
  //async componentWillReceiveProps(nextProps: PropsType) {
  async componentDidMount() {
    //const {node} = nextProps;
    const {node} = this.props;
    if (!node) return;

    /*
    // If the same node has already been processed ...
    const prevNode = this.props.node;
    if (prevNode && node.id === prevNode.id) return;
    */

    const type = await getType(node);
    dispatch('setTypeName', type.name);
    this.loadTypeProps(type);

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

  getInput = (property: PropertyType, value: PrimitiveType) => {
    const {kind, name} = property;

    const onChange = event => {
      const {instanceData} = this.props;
      const {checked, value} = event.target;
      const v = kind === 'boolean' ? checked : value;
      const newInstanceData = {...instanceData, [name]: v};
      dispatch('setInstanceData', newInstanceData);
    };

    const v =
      kind === 'boolean'
        ? Boolean(Number(value))
        : kind === 'number'
          ? Number(value) || 0
          : kind === 'text' ? value || '' : undefined;

    return kind === 'boolean' ? (
      <input type="checkbox" onChange={onChange} checked={v} />
    ) : kind === 'number' ? (
      <input type="number" onChange={onChange} value={v} />
    ) : kind === 'text' ? (
      <input type="text" onChange={onChange} value={v} />
    ) : (
      <div>{`unsupported type ${kind}`}</div>
    );
  };

  async loadTypeProps(typeNode: ?NodeType) {
    console.log('property-form.js loadTypeProps: typeNode =', typeNode);
    if (!typeNode) return;

    const json = await getJson(`types/${typeNode.id}/data`);
    const properties = ((json: any): PropertyType[]);
    const sortedProperties = sortBy(properties, ['name']);
    dispatch('setTypeProps', sortedProperties);
  }

  renderTableHead = () => (
    <thead>
      <tr>
        <th>Property</th>
        <th>Value</th>
      </tr>
    </thead>
  );

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
    await postJson(`instances/${node.id}/data`, instanceData);
    // Clear the instance data.  Is this needed?
    dispatch('setInstanceData', {});

    hideModal();
  };

  render() {
    const {node, typeProps} = this.props;
    if (!typeProps) return null;

    return (
      <div className="child-instances-modal">
        <table>
          {this.renderTableHead()}
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
  }
}

const mapState = (state: StateType): PropsType => {
  const {instanceData, instanceNodeMap, ui} = state;
  const {selectedChildNodeId, typeProps} = ui;
  const node = instanceNodeMap[selectedChildNodeId];
  return {instanceData, node, typeProps};
};

export default connect(mapState)(PropertyForm);
