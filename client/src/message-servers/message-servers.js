// @flow

import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet, Input} from 'redux-easy';

import Button from '../share/button';
import {hostHandler} from '../util/input-util';
import {deleteResource, getJson, postJson} from '../util/rest-util';

import type {
  MessageServerMapType,
  MessageServerType,
  StateType,
  UiType
} from '../types';

import './message-servers.css';

type PropsType = {
  messageServerMap: MessageServerMapType,
  ui: UiType
};

const PROPERTY_NAME_RE = /^[A-Za-z]\w*$/;

class MessageServers extends Component<PropsType> {
  added: boolean;

  addServer = async () => {
    const {messageServerMap, ui: {newServerHost, newServerPort}} = this.props;

    const server: MessageServerType = {
      id: 0,
      host: newServerHost,
      port: newServerPort
    };
    const res = await postJson('message_server', server);
    server.id = await res.text();
    const newMap = {
      ...messageServerMap,
      [server.id]: server
    };

    this.added = true;
    dispatchSet('ui.newServerHost', '');
    dispatchSet('messageServerMap', newMap);
  };

  componentWillMount() {
    this.loadMessageServers();
  }

  deleteServer = async (server: MessageServerType) => {
    const {messageServerMap} = this.props;
    await deleteResource(`message_server/${server.id}`);
    const newMap = {...messageServerMap};
    delete newMap[server.id];
    dispatchSet('messageServerMap', newMap);
  };

  isValidName = () => {
    const {ui: {newPropName, typeProps}} = this.props;
    const propNames = typeProps.map(at => at.name);
    return (
      PROPERTY_NAME_RE.test(newPropName) && !propNames.includes(newPropName)
    );
  };

  loadMessageServers = async () => {
    const json = await getJson('message_server');
    console.log('message-servers.js loadMessageServers: json =', json);
    const servers = ((json: any): MessageServerType[]);
    const messageServerMap = servers.reduce((map, server) => {
      map[server.id] = server;
      return map;
    }, {});
    dispatchSet('messageServerMap', messageServerMap);
  };

  onKeyDown = (event: SyntheticInputEvent<HTMLInputElement>) => {
    console.log('message-servers.js onKeyDown: event.key =', event.key);
  };

  serverNameChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatchSet('ui.newServerName', e.target.value);
  };

  serverPortChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatchSet('ui.newServerPort', e.target.value);
  };

  renderTableHead = () => (
    <thead>
      <tr>
        <th>Host</th>
        <th>Port</th>
        <th>Actions</th>
      </tr>
    </thead>
  );

  renderTableInputRow = () => {
    const {ui: {newServerHost}} = this.props;
    return (
      <tr>
        <td>
          <Input
            className="host-input"
            onKeyDown={hostHandler}
            path="ui.newServerHost"
          />
        </td>
        <td>
          <Input className="port-input" path="ui.newServerPort" type="number" />
        </td>
        <td className="actions-column">
          <Button
            className="add"
            disabled={newServerHost === ''}
            icon="plus"
            onClick={this.addServer}
            tooltip="add server"
          />
        </td>
      </tr>
    );
  };

  renderTableRow = (server: MessageServerType) => (
    <tr key={server.host}>
      <td>{server.host}</td>
      <td>{server.port}</td>
      <td className="actions-column">
        <Button
          className="delete"
          icon="trash-o"
          onClick={() => this.deleteServer(server)}
          tooltip="delete property"
        />
      </td>
    </tr>
  );

  render() {
    const {messageServerMap} = this.props;
    let servers = ((Object.values(messageServerMap): any): MessageServerType[]);
    servers = sortBy(servers, ['host']);

    return (
      <section className="message-servers">
        <h3>Message Servers</h3>
        <table>
          {this.renderTableHead()}
          <tbody>
            {this.renderTableInputRow()}
            {servers.map(server => this.renderTableRow(server))}
          </tbody>
        </table>
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {messageServerMap, ui} = state;
  return {messageServerMap, ui};
};

export default connect(mapState)(MessageServers);
