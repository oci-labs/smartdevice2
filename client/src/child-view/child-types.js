// @flow

import sortBy from 'lodash/sortBy';
import without from 'lodash/without';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import Button from '../share/button';
import {spaceHandler} from '../util/input-util';
import {deleteResource, getJson, postJson} from '../util/rest-util';

import type {AlertTypeType, NodeType, StateType, UiType} from '../types';

import './child-types.css';

type PropsType = {
  typeNode: NodeType,
  ui: UiType
};

type MyStateType = {
  alertTypes: AlertTypeType[]
};

class ChildTypes extends Component<PropsType, MyStateType> {

  state: MyStateType = {
    alertTypes: []
  };

  addAlertType = async () => {
    const {typeNode, ui: {newAlertExpression, newAlertName}} = this.props;
    if (!typeNode) return;

    const alertType = {
      name: newAlertName.trim(),
      expression: newAlertExpression,
      typeId: typeNode.id
    };
    await postJson('alert_type', alertType);

    dispatch('setNewAlertName', '');
    dispatch('setNewAlertExpression', '');
  };

  alertExpressionChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewAlertExpression', e.target.value);
  };

  alertNameChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewAlertName', e.target.value);
  };

  componentWillMount() {
    this.loadAlertTypes(this.props.typeNode);
  }

  componentWillReceiveProps(nextProps) {
    const {typeNode, ui: {newAlertName}} = nextProps;
    if (!typeNode) return;

    // If a new alert was just added ...
    if (newAlertName === '') this.loadAlertTypes(typeNode);
  }

  deleteAlertType = async (alertType: AlertTypeType) => {
    await deleteResource(`alert_type/${alertType.id}`);
    let {alertTypes} = this.state;
    alertTypes = without(alertTypes, alertType);
    this.setState({alertTypes});
  };

  async loadAlertTypes(typeNode: ?NodeType) {
    if (!typeNode) return;

    const json = await getJson(`types/${typeNode.id}/alerts`);
    const alertTypes = ((json: any): AlertTypeType[]);
    const sortedAlertTypes = sortBy(alertTypes, ['name']);
    this.setState({alertTypes: sortedAlertTypes});
  }

  renderGuts() {
    const {typeNode} = this.props;
    if (!typeNode) return null;

    const {alertTypes} = this.state;
    return (
      <div>
        <h3>Alerts for type &quot;{typeNode.name}&quot;</h3>
        <table>
          {this.renderTableHead()}
          <tbody>
            {this.renderTableInputRow()}
            {alertTypes.map(alertType => this.renderTableRow(alertType))}
          </tbody>
        </table>
      </div>
    );
  }

  renderTableHead = () => (
    <thead>
      <tr>
        <th>Alert</th>
        <th>Condition</th>
        <th>Actions</th>
      </tr>
    </thead>
  );

  renderTableInputRow = () => {
    const {ui: {newAlertExpression, newAlertName}} = this.props;
    return (
      <tr>
        <td>
          <input
            type="text"
            onChange={this.alertNameChange}
            onKeyDown={spaceHandler}
            value={newAlertName}
          />
        </td>
        <td>
          <input
            type="text"
            onChange={this.alertExpressionChange}
            value={newAlertExpression}
          />
        </td>
        <td className="actions-column">
          <Button
            className="add-alert-type"
            disabled={newAlertName === '' || newAlertExpression === ''}
            icon="plus"
            onClick={this.addAlertType}
            tooltip="add alert type"
          />
        </td>
      </tr>
    );
  };

  renderTableRow = (alertType: AlertTypeType) => (
    <tr key={alertType.name}>
      <td>{alertType.name}</td>
      <td>{alertType.expression}</td>
      <td className="actions-column">
        <Button
          className="delete"
          icon="trash-o"
          onClick={() => this.deleteAlertType(alertType)}
          tooltip="delete alert type"
        />
      </td>
    </tr>
  );

  render() {
    return (
      <section className="child-types">
        {this.renderGuts()}
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {typeNodeMap, ui} = state;
  const {selectedTypeNodeId} = ui;
  const typeNode = typeNodeMap[selectedTypeNodeId];
  return {typeNode, ui};
};

export default connect(mapState)(ChildTypes);
