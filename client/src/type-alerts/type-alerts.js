// @flow

import sortBy from 'lodash/sortBy';
import without from 'lodash/without';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet} from 'redux-easy';

import MessageServerSelect
  from '../message-server-select/message-server-select';
import Button from '../share/button';
import {showModal} from '../share/sd-modal';
import {values} from '../util/flow-util';
import {isSafeCode, spaceHandler} from '../util/input-util';
import {deleteResource, getJson, postJson} from '../util/rest-util';

import type {
  AlertTypeType,
  EnumMapType,
  NodeType,
  PropertyType,
  StateType,
  UiType
} from '../types';

import './type-alerts.css';

type PropsType = {
  enumMap: EnumMapType,
  typeNode: NodeType,
  typeProps: PropertyType[],
  ui: UiType
};

type MyStateType = {
  alertTypes: AlertTypeType[]
};

const ALERT_NAME_RE = /^[A-Za-z][\w ]*$/;
const PROPERTY_NAME_RE = /^[A-Za-z]\w*$/;

class TypeAlerts extends Component<PropsType, MyStateType> {
  added: boolean;

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

    this.added = true;
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

  componentWillReceiveProps(nextProps: PropsType) {
    const {typeNode} = nextProps;
    if (!typeNode) return;

    const currentTypeNode = this.props.typeNode;
    const newTypeSelected =
      !currentTypeNode || typeNode.id !== currentTypeNode.id;

    // If the type changed or a new alert was just added ...
    if (newTypeSelected || this.added) this.loadAlertTypes(typeNode);
    this.added = false;
  }

  deleteAlertType = async (alertType: AlertTypeType) => {
    await deleteResource(`alert_type/${alertType.id}`);
    let {alertTypes} = this.state;
    alertTypes = without(alertTypes, alertType);
    this.setState({alertTypes});
  };

  getBadNames = () => {
    const {enumMap, typeProps, ui: {newAlertExpression}} = this.props;

    // Allow boolean constants.
    const validNames = new Set(['true', 'false']);

    typeProps.forEach(typeProp => {
      // Allow property names.
      validNames.add(typeProp.name);

      // Allow enum member names.
      const {enumId} = typeProp;
      if (enumId) {
        const anEnum = enumMap[enumId];
        const enumMemberNames =
          values(anEnum.memberMap).map(value => value.name);
        enumMemberNames.forEach(name => validNames.add(name));
      }
    });

    const expressionNames = newAlertExpression
      .split(' ')
      .filter(word => PROPERTY_NAME_RE.test(word));

    return expressionNames.filter(n => !validNames.has(n));
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

    const {treeType} = this.props.ui;
    if (treeType !== 'type') return;

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
        <MessageServerSelect typeNode={typeNode} />

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
  const {enumMap, typeNodeMap, ui} = state;
  const {selectedTypeNodeId, typeProps} = ui;
  const typeNode = typeNodeMap[selectedTypeNodeId];
  return {enumMap, typeNode, typeProps, ui};
};

export default connect(mapState)(TypeAlerts);
