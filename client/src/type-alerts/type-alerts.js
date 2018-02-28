// @flow

import sortBy from 'lodash/sortBy';
import without from 'lodash/without';
import React, {Component} from 'react';
import {dispatchSet, Input, Select, watch} from 'redux-easy';

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
  NodeMapType,
  NodeType,
  UiType
} from '../types';

import './type-alerts.css';

type PropsType = {
  enumMap: EnumMapType,
  typeNodeMap: NodeMapType,
  ui: UiType
};

type MyStateType = {
  alertTypes: AlertTypeType[]
};

const ALERT_NAME_RE = /^[A-Za-z][\w ]*$/;
const PROPERTY_NAME_RE = /^[A-Za-z]\w*$/;

const PRIORITIES = ['', 'info', 'low', 'medium', 'high'];

class TypeAlerts extends Component<PropsType, MyStateType> {
  added: boolean;

  state: MyStateType = {
    alertTypes: []
  };

  addAlertType = async () => {
    const {
      ui: {newAlertExpression, newAlertName, newAlertPriority, newAlertSticky}
    } = this.props;

    const typeNode = this.getTypeNode(this.props);
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
      priority: newAlertPriority,
      sticky: newAlertSticky,
      typeId: typeNode.id
    };
    await postJson('alert_type', alertType);

    this.added = true;
    dispatchSet('ui.newAlertName', '');
    dispatchSet('ui.newAlertExpression', '');
    dispatchSet('ui.newAlertSticky', false);
  };

  componentWillMount() {
    const typeNode = this.getTypeNode(this.props);
    this.loadAlertTypes(typeNode);
  }

  componentWillReceiveProps(nextProps: PropsType) {
    const typeNode = this.getTypeNode(nextProps);
    if (!typeNode) return;

    const currentTypeNode = this.getTypeNode(this.props);
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
    const {enumMap, ui: {newAlertExpression}} = this.props;

    // Allow boolean constants.
    const validNames = new Set(['true', 'false']);

    const {typeProps} = this.props.ui;
    typeProps.forEach(typeProp => {
      // Allow property names.
      validNames.add(typeProp.name);

      // Allow enum member names.
      const {enumId} = typeProp;
      if (enumId) {
        const anEnum = enumMap[enumId];
        const enumMemberNames = values(anEnum.memberMap).map(
          value => value.name
        );
        enumMemberNames.forEach(name => validNames.add(name));
      }
    });

    const expressionNames = newAlertExpression
      .split(' ')
      .filter(word => PROPERTY_NAME_RE.test(word));

    return expressionNames.filter(n => !validNames.has(n));
  };

  getTypeNode = (props: PropsType) => {
    const {typeNodeMap, ui: {selectedTypeNodeId}} = props;
    return typeNodeMap[selectedTypeNodeId];
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

    const {view} = this.props.ui;
    if (view !== 'type') return;

    const json = await getJson(`types/${typeNode.id}/alerts`);
    const alertTypes = ((json: any): AlertTypeType[]);

    // Convert sticky properties from number to boolean.
    alertTypes.forEach(
      alertType => (alertType.sticky = Boolean(alertType.sticky))
    );

    const sortedAlertTypes = sortBy(alertTypes, ['name']);
    this.setState({alertTypes: sortedAlertTypes});
  }

  renderTableInputRow = () => {
    const {ui: {newAlertExpression, newAlertName, newAlertSticky}} = this.props;
    return (
      <tr>
        <td className="name-column">
          <Input
            onKeyDown={spaceHandler}
            path="ui.newAlertName"
            placeholder="alert name"
            value={newAlertName}
          />
        </td>
        <td className="expression-column">
          <Input
            path="ui.newAlertExpression"
            placeholder="condition"
            value={newAlertExpression}
          />
        </td>
        <td className="priority-column">
          <Select
            path="ui.newAlertPriority"
          >
            <option value="1">info</option>
            <option value="2">low</option>
            <option value="3">medium</option>
            <option value="4">high</option>
          </Select>
        </td>
        <td className="sticky-column">
          <Input
            type="checkbox"
            path="ui.newAlertSticky"
            checked={newAlertSticky}
          />
          <label>Sticky</label>
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
      <td className="name-column">{alertType.name}</td>
      <td className="expression-column">{alertType.expression}</td>
      <td className="priority-column">{PRIORITIES[alertType.priority]}</td>
      <td className="sticky-column">{String(alertType.sticky)}</td>
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
    const typeNode = this.getTypeNode(this.props);
    if (!typeNode) return null;

    const {alertTypes} = this.state;
    return (
      <section className="type-alerts">
        <MessageServerSelect typeNode={typeNode} />

        <h3>Alerts for type &quot;{typeNode.name}&quot;</h3>
        <table>
          <tbody>
            {this.renderTableInputRow()}
            {alertTypes.map(alertType => this.renderTableRow(alertType))}
          </tbody>
        </table>
      </section>
    );
  }
}

export default watch(TypeAlerts, {enumMap: '', typeNodeMap: '', ui: ''});
