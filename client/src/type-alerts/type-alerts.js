// @flow

import sortBy from 'lodash/sortBy';
import without from 'lodash/without';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch, dispatchSet} from 'redux-easy';

import Button from '../share/button';
import {showModal} from '../share/sd-modal';
import {isSafeCode, spaceHandler} from '../util/input-util';
import {deleteResource, getJson, postJson, putJson} from '../util/rest-util';

import type {
  AlertTypeType,
  MessageServerType,
  NodePayloadType,
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
  alertTypes: AlertTypeType[],
  messageServers: MessageServerType[]
};

const ALERT_NAME_RE = /^[A-Za-z]\w*/;

class TypeAlerts extends Component<PropsType, MyStateType> {
  added: boolean;

  state: MyStateType = {
    alertTypes: [],
    messageServers: []
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
    this.loadMessageServers();
  }

  componentWillReceiveProps(nextProps) {
    const {typeNode} = nextProps;
    if (!typeNode) return;

    const currentTypeNode = this.props.typeNode;
    const newTypeSelected =
      !currentTypeNode || typeNode.id !== currentTypeNode.id;

    // If the type changed or a new alert was just added ...
    if (newTypeSelected || this.added) this.loadAlertTypes(typeNode);
    if (newTypeSelected) this.loadMessageServers();
    this.added = false;
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

  getMessageServerUi = (typeNode: NodeType) => {
    const isTopLevel = typeNode.parentId === 1;
    if (!isTopLevel) return null;

    const {messageServers} = this.state;
    return (
      <div className="message-server">
        <h3>Message Server for type &quot;{typeNode.name}&quot;</h3>
        <select
          onChange={this.handleServerChange}
          value={typeNode.messageServerId}
        >
          {messageServers.map(server => (
            <option key={server.id} value={server.id}>
              {server.host}
            </option>
          ))}
        </select>
      </div>
    );
  };

  handleServerChange = (event: SyntheticInputEvent<HTMLSelectElement>) => {
    const {typeNode} = this.props;
    const messageServerId = Number(event.target.value);
    const url = `types/${typeNode.id}/server/${messageServerId}`;
    putJson(url);

    const newTypeNode: NodeType = {...typeNode, messageServerId};
    const payload: NodePayloadType = {kind: 'type', node: newTypeNode};
    dispatch('saveNode', payload);
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

  async loadMessageServers() {
    const json = await getJson('message_server');
    const servers = ((json: any): MessageServerType[]);
    const sortedServers = sortBy(servers, ['host']);
    this.setState({messageServers: sortedServers});
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
        {this.getMessageServerUi(typeNode)}

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
