// @flow

import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import PropertyForm from './property-form';
import Button from '../share/button';
import {getJson} from '../util/rest-util';
import {showModal} from '../share/sd-modal';

import type {
  AlertTypeType,
  InstanceDataType,
  NodeType,
  PropertyType,
  StateType
} from '../types';

import './child-instances.css';

type PropsType = {
  instanceData: Object,
  node: NodeType,
  typeAlerts: AlertTypeType[],
  typeName: string,
  typeProps: PropertyType[]
};

function getAlerts(node: NodeType) {
  if (!node) return;

  return getJson(`alerts/${node.id}`);
}

function getData(node: NodeType): InstanceDataType[] {
  if (!node) return [];

  const json = getJson(`instances/${node.id}/data`);
  return ((json: any): InstanceDataType[]);
}

async function getTypeNode(node: NodeType): Promise<?NodeType> {
  if (!node) return null;

  const {typeId} = node;
  if (!typeId) {
    throw new Error(`instance ${node.name} has no type id`);
  }

  const json = await getJson(`type/${typeId}`);
  return ((json: any): Promise<NodeType>);
}

function isTriggered(alertType: AlertTypeType, instanceData: Object): boolean {
  const assignments = Object.entries(instanceData).map(
    ([key, value]) => `const ${key} = ${String(value)};`
  );
  const code = assignments.join(' ') + ' ' + alertType.expression;
  try {
    // eslint-disable-next-line no-eval
    return eval(code);
  } catch (e) {
    // If the expression references properties that are not set,
    // a ReferenceError will thrown.
    // For now we assume the alert is not triggered.
    if (e instanceof ReferenceError) return false;
    throw e;
  }
}

class ChildInstances extends Component<PropsType> {
  componentDidMount() {
    const {node} = this.props;
    this.loadData(node);
  }

  componentWillReceiveProps(nextProps: PropsType) {
    const {node} = nextProps;
    if (!node) return;

    // If the same node has already been processed ...
    const prevNode = this.props.node;
    if (prevNode && node.id === prevNode.id) return;

    this.loadData(node);
  }

  editProperties = () => {
    const {node} = this.props;
    const renderFn = () => <PropertyForm />;
    showModal(node.name + ' Properties', '', renderFn);
  };

  async loadData(instanceNode: NodeType) {
    const typeNode = await getTypeNode(instanceNode);
    dispatch('setTypeName', typeNode ? typeNode.name : '');

    const alerts = await getAlerts(instanceNode);
    dispatch('setInstanceAlerts', alerts);

    this.loadTypeAlerts(typeNode);

    this.loadTypeProps(typeNode);

    this.loadInstanceData(instanceNode);
  }

  async loadInstanceData(instanceNode: NodeType) {
    let data = await getData(instanceNode);
    // Change the shape of this data
    // from an array of InstanceDataType objects
    // to an object with key/value pairs (map).
    data = data.reduce((map, d) => {
      map[d.dataKey] = d.dataValue;
      return map;
    }, {});
    dispatch('setInstanceData', data);
  }

  async loadTypeAlerts(typeNode: ?NodeType) {
    if (!typeNode) return;

    const json = await getJson(`types/${typeNode.id}/alerts`);
    const alerts = ((json: any): AlertTypeType[]);
    const sortedAlerts = sortBy(alerts, ['name']);
    dispatch('setTypeAlerts', sortedAlerts);
  }

  async loadTypeProps(typeNode: ?NodeType) {
    if (!typeNode) return;

    const json = await getJson(`types/${typeNode.id}/data`);
    const properties = ((json: any): PropertyType[]);
    const sortedProperties = sortBy(properties, ['name']);
    dispatch('setTypeProps', sortedProperties);
  }

  renderAlerts = () => {
    const {instanceData, typeAlerts} = this.props;
    const instanceAlerts = typeAlerts.filter(typeAlert =>
      isTriggered(typeAlert, instanceData)
    );
    if (instanceAlerts.length === 0) {
      return <div>none</div>;
    }

    return (
      <div>
        {instanceAlerts.map(typeAlert => (
          <div className="alert" key={typeAlert.name}>
            {typeAlert.name}
          </div>
        ))}
      </div>
    );
  };

  renderGuts = () => {
    const {node, typeName} = this.props;
    if (!node) return null;

    return (
      <div>
        <h3 className="node-name">
          {typeName} {node.name}
          <Button
            className="edit-properties"
            icon="cog"
            onClick={() => this.editProperties()}
            tooltip="edit properties"
          />
        </h3>

        <h4>Properties</h4>
        {this.renderProperties()}

        <h4>Alerts</h4>
        {this.renderAlerts()}
      </div>
    );
  };

  renderProperties = () => {
    const {instanceData, typeProps} = this.props;
    return (
      <table className="property-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {typeProps.map(typeProp =>
            this.renderProperty(typeProp, instanceData)
          )}
        </tbody>
      </table>
    );
  };

  renderProperty = (typeProp: PropertyType, instanceData: Object) => {
    const {name} = typeProp;
    let value = instanceData[name];
    const isBoolean = typeProp.kind === 'boolean';
    value = isBoolean
      ? Boolean(Number(value))
      : value === undefined ? 'unset' : value;

    return (
      <tr key={name}>
        <td>{name}</td>
        <td>{String(value)}</td>
      </tr>
    );
  };

  render() {
    return (
      <section className="child-instances">
        {this.renderGuts()}
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {instanceData, instanceNodeMap, ui} = state;
  const {selectedChildNodeId, typeAlerts, typeName, typeProps} = ui;
  const node = instanceNodeMap[selectedChildNodeId];
  return {instanceData, node, typeAlerts, typeName, typeProps};
};

export default connect(mapState)(ChildInstances);
