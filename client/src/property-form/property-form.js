// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import Button from '../share/button';
import {postJson} from '../util/rest-util';
import {hideModal} from '../share/sd-modal';

import type {NodeType, PrimitiveType, PropertyType, StateType} from '../types';

import './property-form.css';

type PropsType = {
  instanceData: Object,
  node: NodeType,
  typeProps: PropertyType[]
};

class PropertyForm extends Component<PropsType> {
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
    const res = await postJson(`instances/${node.id}/data`, instanceData);
    const alerts = await res.json();
    dispatch('setAlerts', alerts);

    hideModal();
  };

  render() {
    const {node, typeProps} = this.props;
    if (!typeProps) return null;

    return (
      <div className="property-form">
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
