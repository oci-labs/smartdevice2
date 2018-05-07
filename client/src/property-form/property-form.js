// @flow

import React, {Component} from 'react';
import {dispatch, dispatchSet, Input, watch} from 'redux-easy';

import Button from '../share/button';
import {postJson} from '../util/rest-util';
import {hideModal} from '../share/sd-modal';

import type {NodeMapType, NodeType, PropertyType, UiType} from '../types';

import './property-form.css';

type PropsType = {
  instanceData: Object,
  instanceNodeMap: NodeMapType,
  ui: UiType
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

  getInstanceNode = () => {
    const {instanceNodeMap, ui} = this.props;
    return instanceNodeMap[ui.selectedChildNodeId];
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
    const {instanceData} = this.props;
    const node = this.getInstanceNode();

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
    const {typeProps} = this.props.ui;
    if (!typeProps) return null;

    const node = this.getInstanceNode();
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

export default watch(PropertyForm, {
  instanceData: '',
  instanceNodeMap: '',
  ui: ''
});
