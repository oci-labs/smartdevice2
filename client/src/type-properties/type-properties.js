// @flow

import sortBy from 'lodash/sortBy';
import without from 'lodash/without';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet} from 'redux-easy';

import Button from '../share/button';
import {validNameHandler} from '../util/input-util';
import {deleteResource, getJson, postJson} from '../util/rest-util';

import type {NodeType, PropertyType, StateType, UiType} from '../types';

import './type-properties.css';

type PropsType = {
  typeNode: ?NodeType,
  ui: UiType
};

type MyStateType = {
  typeProps: PropertyType[]
};

class TypeProperties extends Component<PropsType, MyStateType> {
  state: MyStateType = {
    typeProps: []
  };

  addProp = async () => {
    const {typeNode, ui: {newPropName, newPropType}} = this.props;
    if (!typeNode) return;

    const typeData = {
      kind: newPropType,
      name: newPropName,
      typeId: typeNode.id
    };
    await postJson('type_data', typeData);
    dispatchSet('ui.newPropName', '');
  };

  componentWillMount() {
    this.loadTypeProps(this.props.typeNode);
  }

  componentWillReceiveProps(nextProps) {
    const {typeNode, ui: {newPropName}} = nextProps;
    if (!typeNode) return;

    // If a new prop was just added ...
    if (newPropName === '') this.loadTypeProps(typeNode);
  }

  deleteProp = async (typeProp: PropertyType) => {
    await deleteResource(`type_data/${typeProp.id}`);
    let {typeProps} = this.state;
    typeProps = without(typeProps, typeProp);
    this.setState({typeProps});
  };

  async loadTypeProps(typeNode: ?NodeType) {
    if (!typeNode) return;

    const json = await getJson(`types/${typeNode.id}/data`);
    const typeProps = ((json: any): PropertyType[]);
    const sortedTypeProps = sortBy(typeProps, ['name']);
    this.setState({typeProps: sortedTypeProps});
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
    const {ui: {newPropName, newPropType}} = this.props;
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
            <option>boolean</option>
            <option>number</option>
            <option>percent</option>
            <option>text</option>
          </select>
        </td>
        <td className="actions-column">
          <Button
            className="add-prop"
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
    const {typeNode} = this.props;
    if (!typeNode) {
      return (
        <section className="type-properties">
          Select a type in the left nav.
        </section>
      );
    }

    const {typeProps} = this.state;
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
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {typeNodeMap, ui} = state;
  const {selectedTypeNodeId} = ui;
  const typeNode = typeNodeMap[selectedTypeNodeId];
  return {typeNode, ui};
};

export default connect(mapState)(TypeProperties);
