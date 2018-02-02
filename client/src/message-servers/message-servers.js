// @flow

import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet, Input} from 'redux-easy';

import Button from '../share/button';
import {showModal} from '../share/sd-modal';
import {values} from '../util/flow-util';
import {hostHandler, isHostName, isIpAddress} from '../util/input-util';
import {deleteResource, getJson, postJson, putJson} from '../util/rest-util';

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

export async function loadMessageServers() {
  try {
    const json = await getJson('message_server');
    const servers = ((json: any): MessageServerType[]);
    const messageServerMap = servers.reduce((map, server) => {
      map[server.id] = server;
      return map;
    }, {});
    dispatchSet('messageServerMap', messageServerMap);
  } catch (e) {
    console.error('failed to load message servers');
  }
}

class MessageServers extends Component<PropsType> {
  addServer = async () => {
    const {messageServerMap, ui: {newServerHost, newServerPort}} = this.props;

    if (!isHostName(newServerHost) && !isIpAddress(newServerHost)) {
      showModal({
        error: true,
        title: 'Invalid Host',
        message: 'The value is not a valid host name or IP address.'
      });
      return;
    }

    const server: MessageServerType = {
      id: 0,
      host: newServerHost,
      port: newServerPort
    };
    const res = await postJson('messageServers', server);
    server.id = await res.text();
    const newMap = {
      ...messageServerMap,
      [server.id]: server
    };

    dispatchSet('ui.newServerHost', '');
    dispatchSet('messageServerMap', newMap);
  };

  componentWillMount() {
    loadMessageServers();
  }

  deleteServer = async (server: MessageServerType) => {
    // Remove this message server from all top-level types
    // that are currently associated with it.
    // Using a type id of zero signals to do this.
    const url = `types/0/server/${server.id}`;
    await putJson(url);

    // Delete the message server.
    const {messageServerMap} = this.props;
    await deleteResource(`messageServers/${server.id}`);
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
    let servers = values(messageServerMap);
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
