// @flow

import sortBy from 'lodash/sortBy';
import without from 'lodash/without';
import React, {Component} from 'react';
import {dispatchSet, getState, Input, watch} from 'redux-easy';

import Button from '../share/button';
import Enums from '../enums/enums';
import {showModal} from '../share/sd-modal';
import {addNode, deleteNode} from '../tree/tree-util';
import {values} from '../util/flow-util';
import {validNameHandler} from '../util/input-util';
import {deleteResource, getJson, postJson} from '../util/rest-util';

import type {
  EnumMapType,
  NodeMapType,
  NodeType,
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

function createNewType(parent: NodeType) {
  const name = getState().ui.typeName;
  addNode('type', name, parent);
}

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
    const renderFn = () => (
      <div>
        <div>
          <label>Name</label>
          <Input autoFocus path="ui.typeName" />
        </div>
        <div className="button-row">
          <button className="button" onClick={() => createNewType(typeNode)}>
            Create
          </button>
        </div>
      </div>
    );
    showModal({title: 'Add Type', renderFn});
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
      <Button
        key="delete"
        className="delete"
        icon="trash-o"
        onClick={this.deleteType}
      />
      <Button key="add" className="add" icon="plus" onClick={this.addType} />
    </div>
  );

  propNameChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatchSet('ui.newPropName', e.target.value);
  };

  propTypeChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatchSet('ui.newPropType', e.target.value);
  };

  renderTableHead = () => (
    <thead>
      <tr>
        <th>Name</th>
        <th>Data Type</th>
        <th>Actions</th>
      </tr>
    </thead>
  );

  renderTableInputRow = () => {
    const {enumMap, ui: {newPropName, newPropType}} = this.props;

    const enums = values(enumMap);
    const enumNames = enums.map(obj => obj.name);
    const typeNames = [...BUILTIN_TYPES, ...enumNames].sort();

    return (
      <tr>
        <td>
          <input
            type="text"
            onKeyDown={validNameHandler}
            onChange={this.propNameChange}
            value={newPropName}
          />
        </td>
        <td>
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
      <td>{typeProp.name}</td>
      <td>{typeProp.kind}</td>
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
          <h3>Select a type in the left nav.</h3>
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
            {this.renderTableHead()}
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
