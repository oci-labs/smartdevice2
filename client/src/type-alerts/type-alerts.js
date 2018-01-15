// @flow

import sortBy from 'lodash/sortBy';
import without from 'lodash/without';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet} from 'redux-easy';

import Button from '../share/button';
import {showModal} from '../share/sd-modal';
import {isSafeCode, spaceHandler} from '../util/input-util';
import {deleteResource, getJson, postJson} from '../util/rest-util';

import type {
  AlertTypeType,
  NodeType,
  PropertyType,
  StateType,
  UiType
} from '../types';

import './type-alerts.css';

type PropsType = {
  typeNode: NodeType,
  typeProps: PropertyType[],
  ui: UiType
};

type MyStateType = {
  alertTypes: AlertTypeType[]
};

const ALERT_NAME_RE = /^[A-Za-z]\w*/;

class TypeAlerts extends Component<PropsType, MyStateType> {
  state: MyStateType = {
    alertTypes: []
  };

  addAlertType = async () => {
    const {
      typeNode,
      ui: {newAlertExpression, newAlertName, newAlertSticky}
    } = this.props;
    if (!typeNode) return;

    if (!this.isValidName()) {
      showModal({
        error: true,
        title: 'Invalid Alert Condition',
        message: 'The alert name is invalid or is already in use.'
      });
      return;
    }

    if (!isSafeCode(newAlertExpression)) {
      showModal({
        error: true,
        title: 'Invalid Alert Condition',
        message: 'Function calls are not allowed.'
      });
      return;
    }

    const badNames = this.getBadNames();
    if (badNames.length) {
      showModal({
        error: true,
        title: 'Invalid Alert Condition',
        message: 'These names do not match a property:\n' + badNames.join(', ')
      });
      return;
    }

    const alertType = {
      name: newAlertName.trim(),
      expression: newAlertExpression,
      sticky: newAlertSticky,
      typeId: typeNode.id
    };
    await postJson('alert_type', alertType);

    dispatchSet('ui.newAlertName', '');
    dispatchSet('ui.newAlertExpression', '');
    dispatchSet('ui.newAlertSticky', false);
  };

  alertExpressionChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    const {value} = e.target;
    dispatchSet('ui.newAlertExpression', value);
  };

  alertNameChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatchSet('ui.newAlertName', e.target.value);
  };

  alertStickyChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatchSet('ui.newAlertSticky', e.target.checked);
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

  getBadNames = () => {
    const {typeProps, ui: {newAlertExpression}} = this.props;
    const expressionNames = newAlertExpression
      .split(' ')
      .filter(word => ALERT_NAME_RE.test(word));
    const propNames = typeProps.map(typeProp => typeProp.name);
    return expressionNames.filter(n => !propNames.includes(n));
  };

  isValidName = () => {
    const {alertTypes} = this.state;
    const {ui: {newAlertName}} = this.props;
    const alertNames = alertTypes.map(at => at.name);
    return (
      ALERT_NAME_RE.test(newAlertName) && !alertNames.includes(newAlertName)
    );
  };

  async loadAlertTypes(typeNode: ?NodeType) {
    if (!typeNode) return;

    const json = await getJson(`types/${typeNode.id}/alerts`);
    const alertTypes = ((json: any): AlertTypeType[]);

    // Convert sticky properties from number to boolean.
    alertTypes.forEach(
      alertType => (alertType.sticky = Boolean(alertType.sticky))
    );

    const sortedAlertTypes = sortBy(alertTypes, ['name']);
    this.setState({alertTypes: sortedAlertTypes});
  }

  renderTableHead = () => (
    <thead>
      <tr>
        <th>Alert</th>
        <th>Condition</th>
        <th>Sticky</th>
        <th>Actions</th>
      </tr>
    </thead>
  );

  renderTableInputRow = () => {
    const {ui: {newAlertExpression, newAlertName, newAlertSticky}} = this.props;
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
        <td>
          <input
            type="checkbox"
            onChange={this.alertStickyChange}
            checked={newAlertSticky}
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
      <td>{String(alertType.sticky)}</td>
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
    const {typeNode} = this.props;
    if (!typeNode) return null;

    const {alertTypes} = this.state;
    return (
      <section className="type-alerts">
        <h3>Alerts for type &quot;{typeNode.name}&quot;</h3>
        <table>
          {this.renderTableHead()}
          <tbody>
            {this.renderTableInputRow()}
            {alertTypes.map(alertType => this.renderTableRow(alertType))}
          </tbody>
        </table>
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {typeNodeMap, ui} = state;
  const {selectedTypeNodeId, typeProps} = ui;
  const typeNode = typeNodeMap[selectedTypeNodeId];
  return {typeNode, typeProps, ui};
};

export default connect(mapState)(TypeAlerts);
