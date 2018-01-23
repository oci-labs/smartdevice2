// @flow

import sortBy from 'lodash/sortBy';
import without from 'lodash/without';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet} from 'redux-easy';

import Button from '../share/button';
import Enums from '../enums/enums';
import {showModal} from '../share/sd-modal';
import {values} from '../util/flow-util';
import {validNameHandler} from '../util/input-util';
import {deleteResource, getJson, postJson} from '../util/rest-util';

import type {
  EnumMapType,
  NodeType,
  PropertyType,
  StateType,
  UiType
} from '../types';

import './type-properties.css';

type PropsType = {
  enumMap: EnumMapType,
  typeNode: ?NodeType,
  ui: UiType
};

const BUILTIN_TYPES = ['boolean', 'number', 'percent', 'text'];

const PROPERTY_NAME_RE = /^[A-Za-z]\w*$/;

class TypeProperties extends Component<PropsType> {
  added: boolean;

  addProp = async () => {
    const {typeNode, ui: {newPropName, newPropType}} = this.props;
    if (!typeNode) return;

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

  getEnumId = (enumName: string): number => {
    const {enumMap} = this.props;
    const enums = values(enumMap);
    const anEnum = enums.find(anEnum => anEnum.name === enumName);
    return anEnum ? anEnum.id : -1;
  };

  componentWillMount() {
    this.loadTypeProps(this.props.typeNode);
  }

  componentWillReceiveProps(nextProps) {
    const {typeNode} = nextProps;
    if (!typeNode) return;

    const currentTypeNode = this.props.typeNode;
    const newTypeSelected =
      !currentTypeNode || typeNode.id !== currentTypeNode.id;

    // If the type changed or a new property was just added ...
    if (newTypeSelected || this.added) this.loadTypeProps(typeNode);
    this.added = false;
  }

  deleteProp = async (typeProp: PropertyType) => {
    await deleteResource(`type_data/${typeProp.id}`);
    let {typeProps} = this.props.ui;
    typeProps = without(typeProps, typeProp);
    dispatchSet('ui.typeProps', typeProps);
  };

  isValidName = () => {
    const {ui: {newPropName, typeProps}} = this.props;
    const propNames = typeProps.map(at => at.name);
    return (
      PROPERTY_NAME_RE.test(newPropName) && !propNames.includes(newPropName)
    );
  };

  async loadTypeProps(typeNode: ?NodeType) {
    if (!typeNode) return;

    const json = await getJson(`types/${typeNode.id}/data`);
    const typeProps = ((json: any): PropertyType[]);
    const sortedTypeProps = sortBy(typeProps, ['name']);
    dispatchSet('ui.typeProps', sortedTypeProps);
  }

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
    const {typeNode, ui: {typeProps}} = this.props;
    if (!typeNode) {
      return (
        <section className="type-properties">
          Select a type in the left nav.
        </section>
      );
    }

    return (
      <section className="type-properties">
        <h3>Properties for type &quot;{typeNode.name}&quot;</h3>
        <table>
          {this.renderTableHead()}
          <tbody>
            {this.renderTableInputRow()}
            {typeProps.map(typeProp => this.renderTableRow(typeProp))}
          </tbody>
        </table>

        <Enums />
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {enumMap, typeNodeMap, ui} = state;
  const {selectedTypeNodeId} = ui;
  const typeNode = typeNodeMap[selectedTypeNodeId];
  return {enumMap, typeNode, ui};
};

export default connect(mapState)(TypeProperties);
