// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch, dispatchSet, Input} from 'redux-easy';

import Button from '../share/button';
import {postJson} from '../util/rest-util';
import {hideModal} from '../share/sd-modal';

import type {NodeType, PropertyType, StateType} from '../types';

import './property-form.css';

type PropsType = {
  instanceData: Object,
  node: NodeType,
  typeProps: PropertyType[]
};

const inputTypes = {
  boolean: 'checkbox',
  number: 'number',
  percent: 'number',
  text: 'text'
};

class PropertyForm extends Component<PropsType> {
  getInput = (property: PropertyType) => {
    const {kind, name} = property;
    const type = inputTypes[kind];
    return type ? (
      <Input type={type} path={'instanceData.' + name} />
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
    return (
      <tr key={property.id}>
        <td>
          <label>{name}</label>
        </td>
        <td>{this.getInput(property)}</td>
      </tr>
    );
  };

  saveProperties = async () => {
    const {instanceData, node} = this.props;

    Object.keys(instanceData).forEach(property => {
      const value = instanceData[property];
      const change = {
        instanceId: node.id,
        property,
        value
      };
      dispatch('setInstanceProperty', change);
    });

    const res = await postJson(`instances/${node.id}/data`, instanceData);
    const alerts = await res.json();
    dispatchSet('alerts', alerts);

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
          onClick={() => this.saveProperties()}
          tooltip="save properties"
        >
          Save
        </Button>
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
