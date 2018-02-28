// @flow

import sortBy from 'lodash/sortBy';
import without from 'lodash/without';
import React, {Component} from 'react';
import {dispatchSet, Input, watch} from 'redux-easy';

import Button from '../share/button';
import Enums from '../enums/enums';
import {showModal, showPrompt} from '../share/sd-modal';
import {createNode, deleteNode} from '../tree/tree-util';
import {values} from '../util/flow-util';
import {validNameHandler} from '../util/input-util';
import {deleteResource, getJson, postJson} from '../util/rest-util';

import type {
  EnumMapType,
  NodeMapType,
  PropertyType,
  UiType
} from '../types';

import './type-properties.css';

type PropsType = {
  enumMap: EnumMapType,
  typeNodeMap: NodeMapType,
  ui: UiType
};

const BUILTIN_TYPES = ['boolean', 'number', 'percent', 'text'];

const PROPERTY_NAME_RE = /^[A-Za-z]\w*$/;

class TypeProperties extends Component<PropsType> {
  added: boolean;

  addProp = async () => {
    const typeNode = this.getTypeNode(this.props);
    if (!typeNode) return;

    const {ui: {newPropName, newPropType}} = this.props;

    if (!this.isValidName()) {
      showModal({
        error: true,
        title: 'Invalid Property',
        message: 'The property name is invalid or is already in use.'
      });
      return;
    }

    const enumId = this.getEnumId(newPropType);
    const typeData = {
      enumId: enumId === -1 ? undefined : enumId,
      kind: newPropType,
      name: newPropName,
      typeId: typeNode.id
    };
    await postJson('type_data', typeData);

    this.added = true;
    dispatchSet('ui.newPropName', '');
  };

  addType = () => {
    const typeNode = this.getTypeNode(this.props);
    showPrompt({
      buttonText: 'Create',
      label: 'Name',
      okCb: () => createNode('type', typeNode),
      path: 'ui.typeName',
      title: 'Add Type'
    });
  };

  breadcrumbs = typeNode => {
    const {typeNodeMap} = this.props;
    let crumbs = typeNode.name;

    while (true) {
      const {parentId} = typeNode;
      if (!parentId) break;
      const parentNode = typeNodeMap[parentId];
      const {name} = parentNode;
      if (name === 'root') break;
      crumbs = name + ' > ' + crumbs;
      typeNode = parentNode;
    }

    return <div className="breadcrumbs">{crumbs}</div>;
  };

  componentWillMount() {
    this.loadTypeProps();
  }

  componentWillReceiveProps(nextProps) {
    const typeNode = this.getTypeNode(nextProps);
    if (!typeNode) return;

    const currentTypeNode = this.getTypeNode(this.props);
    const newTypeSelected =
      !currentTypeNode || typeNode.id !== currentTypeNode.id;

    // If the type changed or a new property was just added ...
    if (newTypeSelected || this.added) this.loadTypeProps();
    this.added = false;
  }

  deleteProp = async (typeProp: PropertyType) => {
    await deleteResource(`type_data/${typeProp.id}`);
    let {typeProps} = this.props.ui;
    typeProps = without(typeProps, typeProp);
    dispatchSet('ui.typeProps', typeProps);
  };

  deleteType = () => {
    const typeNode = this.getTypeNode(this.props);
    deleteNode('type', typeNode);
  };

  getEnumId = (enumName: string): number => {
    const {enumMap} = this.props;
    const enums = values(enumMap);
    const anEnum = enums.find(anEnum => anEnum.name === enumName);
    return anEnum ? anEnum.id : -1;
  };

  getTypeNode = (props: PropsType) => {
    const {typeNodeMap, ui: {selectedTypeNodeId}} = props;
    return typeNodeMap[selectedTypeNodeId];
  };

  isValidName = () => {
    const {ui: {newPropName, typeProps}} = this.props;
    const propNames = typeProps.map(at => at.name);
    return (
      PROPERTY_NAME_RE.test(newPropName) && !propNames.includes(newPropName)
    );
  };

  async loadTypeProps() {
    const typeNode = this.getTypeNode(this.props);
    if (!typeNode) return;

    const json = await getJson(`types/${typeNode.id}/data`);
    const typeProps = ((json: any): PropertyType[]);
    const sortedTypeProps = sortBy(typeProps, ['name']);
    dispatchSet('ui.typeProps', sortedTypeProps);
  }

  propertyButtons = () => (
    <div className="buttons">
      <Button key="add" className="add" icon="plus" onClick={this.addType} />
      <Button
        key="delete"
        className="delete"
        icon="trash-o"
        onClick={this.deleteType}
      />
    </div>
  );

  propTypeChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatchSet('ui.newPropType', e.target.value);
  };

  renderTableInputRow = () => {
    const {enumMap, ui: {newPropName, newPropType}} = this.props;

    const enums = values(enumMap);
    const enumNames = enums.map(obj => obj.name);
    const typeNames = [...BUILTIN_TYPES, ...enumNames].sort();

    return (
      <tr>
        <td className="name-column">
          <Input
            placeholder="property name"
            type="text"
            onEnter={this.addProp}
            onKeyDown={validNameHandler}
            path="ui.newPropName"
            value={newPropName}
          />
        </td>
        <td className="kind-column">
          <select onChange={this.propTypeChange} value={newPropType}>
            {typeNames.map(typeName => (
              <option key={typeName}>{typeName}</option>
            ))}
          </select>
        </td>
        <td className="actions-column">
          <Button
            className="add"
            disabled={newPropName === ''}
            icon="plus"
            onClick={this.addProp}
            tooltip="add property"
          />
        </td>
      </tr>
    );
  };

  renderTableRow = (typeProp: PropertyType) => (
    <tr key={typeProp.name}>
      <td className="name-column">{typeProp.name}</td>
      <td className="kind-column">{typeProp.kind}</td>
      <td className="actions-column">
        <Button
          className="delete"
          icon="trash-o"
          onClick={() => this.deleteProp(typeProp)}
          tooltip="delete property"
        />
      </td>
    </tr>
  );

  render() {
    const {ui: {typeProps}} = this.props;
    const typeNode = this.getTypeNode(this.props);
    if (!typeNode) {
      return (
        <section className="type-properties">
          <div className="message">Select a type in the left nav.</div>
        </section>
      );
    }

    return (
      <section className="type-properties">
        <header>
          <div>
            <div className="title">{typeNode.name}</div>
            {this.propertyButtons()}
          </div>
          {this.breadcrumbs(typeNode)}
        </header>
        <section>
          <h3>Properties</h3>
          <table>
            <tbody>
              {this.renderTableInputRow()}
              {typeProps.map(typeProp => this.renderTableRow(typeProp))}
            </tbody>
          </table>
        </section>

        <Enums />
      </section>
    );
  }
}

export default watch(TypeProperties, {
  enumMap: '',
  typeNodeMap: '',
  ui: ''
});
