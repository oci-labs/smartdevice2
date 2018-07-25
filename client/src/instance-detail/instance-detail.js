// @flow

import capitalize from 'lodash/capitalize';
import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {dispatchSet, watch, dispatch} from 'redux-easy';

import InstanceAlerts from '../instance-alerts/instance-alerts';
import PropertyForm from '../property-form/property-form';
import Button from '../share/button';
import {showModal, showPrompt} from '../share/sd-modal';
import {createNode, deleteNode, getChildTypes} from '../tree/tree-util';
import {values} from '../util/flow-util';
import {getJson} from '../util/rest-util';
import {getTypeNode, loadTypeNode} from '../util/node-util';
import {LineChart, ColumnChart} from 'react-chartkick';
import Chart from 'chart.js';
import * as moment from 'moment';

import type {
  AlertType,
  EnumMapType,
  EnumType,
  InstanceDataType,
  NodeMapType,
  NodeType,
  PropertyType,
  UiType
} from '../types';

import './instance-detail.css';

type PropsType = {
  enumMap: EnumMapType,
  instanceData: Object,
  instanceNodeMap: NodeMapType,
  ui: UiType
};

/*
async function getAlerts(node: NodeType): Promise<AlertType[]> {
  if (!node) return Promise.resolve([]);

  const json = await getJson(`alerts/${node.id}`);
  return ((json: any): AlertType[]);
}
*/

async function getAllAlerts(): Promise<AlertType[]> {
  const json = await getJson('alerts');
  return ((json: any): AlertType[]);
}

function getData(node: NodeType): InstanceDataType[] {
  if (!node) return [];

  const json = getJson(`instances/${node.id}/data`);
  return ((json: any): InstanceDataType[]);
}

export async function reloadAlerts() {
  const alerts = await getAllAlerts();
  dispatchSet('alerts', alerts);
}

class InstanceDetail extends Component<PropsType> {
  addInstance = () => {
    const node = this.getNode(this.props);
    showPrompt({
      buttonText: 'Create',
      label: 'Name',
      okCb: () => createNode('instance', node),
      path: 'ui.instanceName',
      title: 'Add Instance'
    });
  };

  alertIsFor(instanceId: number, alertInstanceId: number) {
    if (alertInstanceId === instanceId) return true;
    const {instanceNodeMap} = this.props;
    const node = instanceNodeMap[instanceId];
    const {children} = node;
    return children.some(childId => this.alertIsFor(childId, alertInstanceId));
  }

  breadcrumbs = instanceNode => {
    const {instanceNodeMap} = this.props;
    const crumbs = [<span key="self">{instanceNode.name}</span>];

    const selectInstance = id => dispatchSet('ui.selectedInstanceNodeId', id);

    while (true) {
      const {parentId} = instanceNode;
      if (!parentId) break;
      const parentNode = instanceNodeMap[parentId];
      const {name} = parentNode;
      if (name === 'root') break;
      crumbs.unshift(<span key={parentId}> &gt; </span>);
      crumbs.unshift(
        <a
          className="breadcrumb"
          key={parentId + name}
          onClick={() => selectInstance(parentId)}
        >
          {name}
        </a>
      );
      instanceNode = parentNode;
    }

    return <div className="breadcrumbs">{crumbs}</div>;
  };

  componentDidMount() {
    const node = this.getNode(this.props);
    this.loadData(node);
  }

  componentWillReceiveProps(nextProps: PropsType) {
    const node = this.getNode(nextProps);
    if (!node) return;

    // If the same node has already been processed ...
    const prevNode = this.getNode(this.props);
    if (prevNode && node.id === prevNode.id) return;

    this.loadData(node);
  }

  deleteInstance = () => {
    const node = this.getNode(this.props);
    deleteNode('instance', node);
  };

  editProperties = () => {
    const node = this.getNode(this.props);
    const renderFn = () => <PropertyForm />;
    showModal({title: node.name + ' Properties', renderFn});
  };

  formatValue = (kind, value) => {
    if (value === undefined) return 'unset';
    if (kind === 'boolean') return Boolean(Number(value));
    if (kind === 'percent') return Number(value).toFixed(2) + '%';
    if (kind === 'number') return value;
    if (kind === 'text') return value;

    // Define if this is an enumerated type ...
    const {enumMap} = this.props;
    const enums = values(enumMap);
    const anEnum = enums.find(anEnum => anEnum.name === kind);
    if (anEnum) {
      const members = values(anEnum.memberMap);
      const v = Number(value);
      const member = members.find(member => member.value === v);
      return member ? member.name : 'bad enum value ' + value;
    }

    return value; // works for kind = 'number', 'text', ...
  };

  getNode = (props: PropsType) => {
    const {instanceNodeMap, ui} = props;
    return instanceNodeMap[ui.selectedInstanceNodeId];
  };

  instanceButtons = () => {
    const node = this.getNode(this.props);
    const canAddChild = getChildTypes(node).length > 0;
    return (
      <div className="buttons">
        {canAddChild && (
          <Button
            key="add"
            className="add"
            icon="plus"
            onClick={this.addInstance}
            tooltip="add child instance"
          />
        )}
        <Button
          key="delete"
          className="delete"
          icon="trash-o"
          onClick={this.deleteInstance}
          tooltip="delete instance"
        />
      </div>
    );
  };

  async loadData(instanceNode: NodeType) {
    const typeNode = await loadTypeNode(instanceNode);

    reloadAlerts();

    this.loadEnums();
    const properties = await this.loadTypeProps(typeNode);
    this.loadInstanceData(instanceNode, properties);
  }

  async loadEnums() {
    const json = await getJson('enums');
    const enums = ((json: any): EnumType[]);
    const enumMap = enums.reduce((map, anEnum) => {
      map[anEnum.id] = anEnum;
      return map;
    }, {});
    dispatchSet('enumMap', enumMap);
  }

  async loadInstanceData(instanceNode: NodeType, properties) {
    let data = await getData(instanceNode);
    // Change the shape of this data
    // from an array of InstanceDataType objects
    // to an object with key/value pairs (map).
    data = data.reduce((map, d) => {
      map[d.dataKey] = d.dataValue;
      return map;
    }, {});
    dispatchSet('instanceData', data);
    const initialChartData = data
      ? Object.keys(data).reduce((chartData, key) => {
        const propertyType = properties.find(prop => prop.name === key);

        const value =
            propertyType && propertyType.kind === 'boolean'
              ? Boolean(data[key])
              : data[key];
        return {
          ...chartData,
          [key]: {[moment().valueOf()]: value}
        };
      }, {})
      : {};
    dispatchSet('chartData', initialChartData);
  }

  async loadTypeProps(typeNode: ?NodeType) {
    if (!typeNode) return;

    const json = await getJson(`types/${typeNode.id}/data`);
    const properties = ((json: any): PropertyType[]);
    const sortedProperties = sortBy(properties, ['name']);
    dispatchSet('ui.typeProps', sortedProperties);
    return sortedProperties;
  }

  renderProperties = () => {
    const {
      instanceData,
      chartProperties,
      ui: {typeProps}
    } = this.props;

    if (!typeProps || typeProps.length === 0) {
      return <div className="property-table">none</div>;
    }

    return (
      <table className="property-table">
        <tbody>
          {typeProps.map(typeProp =>
            this.renderProperty(
              typeProp,
              instanceData,
              chartProperties[typeProp.name]
            )
          )}
        </tbody>
      </table>
    );
  };

  renderProperty = (
    typeProp: PropertyType,
    instanceData: Object,
    showProperty: Boolean
  ) => {
    const {kind, name} = typeProp;
    const value = instanceData[name];
    const setBoolean = () => {
      dispatch('toggleChartProperty', {property: name});
    };
    return (
      <tr key={name}>
        <form>
          <input
            type="checkbox"
            name="propertyType"
            value={showProperty}
            // onChange={event => onChange(event.target.value)}
            onClick={setBoolean}
          />
          <label htmlFor={name}>{name}</label>
        </form>
        {/* <td>{name}</td> */}
        <td className={kind}>{String(this.formatValue(kind, value))}</td>
      </tr>
    );
  };

  constructPropertyData = (name, values, type) => {
    const propertyData = {
      name,
      data: {}
    };

    propertyData.data = Object.keys(values).reduce((data, key) => {
      // console.log(moment(key).format('ss'));
      let value = values[key];

      if (type.kind === 'boolean') {
        value = Number(values[key]);
      } else if (type.kind === 'percent') {
        value = Number(values[key] / 100);
      }
      data[moment(Number(key)).format('h:mm:ss')] = value;
      return data;
    }, propertyData.data);

    return propertyData;
  };

  constructChartData = (data, typeProps) => {
    const chartData = Object.keys(data).map(property => {
      const type = typeProps.find(prop => prop.name === property);
      return this.constructPropertyData(property, data[property], type);
    });
    return chartData;
  };

  //TODO: Need to use properties to check boolean and render or not render sections of chart
  // constructChartData = (data, typeProps, properties) => {
  //   const chartData = Object.keys(data).map(property => {
  //     const type = typeProps.find(prop => prop.name === property);
  //     return this.constructPropertyData(property, data[property], type);
  //   });
  //   return chartData;
  // };

  render() {
    const {
      chartData,
      chartProperties,
      instanceData,
      ui: {typeProps}
    } = this.props;

    // const formattedData = this.constructChartData(
    //   chartData,
    //   typeProps,
    //   chartProperties
    // );
    const formattedData = this.constructChartData(chartData, typeProps);

    const node = this.getNode(this.props);
    if (!node) return null;

    const typeNode = getTypeNode(node);
    const typeName = typeNode ? typeNode.name : null;

    return (
      <section className="instance-detail">
        <header>
          <div className="title">
            {capitalize(typeName)} &quot;{node.name}&quot;
            {this.instanceButtons()}
          </div>
          {this.breadcrumbs(node)}
        </header>
        <section>
          <div className="heading">
            Properties
            <Button
              className="edit-properties"
              icon="cog"
              onClick={() => this.editProperties()}
              tooltip="edit properties"
              value="test"
            />
          </div>
          {this.renderProperties()}
        </section>
        <InstanceAlerts />
        <LineChart
          data={formattedData}
          height="300px"
          width="500px"
          xtitle="Property Values"
          dataset={{pointStyle: 'dash', pointRadius: 1}}
        />
      </section>
    );
  }
}

export default watch(InstanceDetail, {
  enumMap: '',
  instanceData: '',
  instanceNodeMap: '',
  ui: '',
  chartData: '',
  chartProperties: ''
});
