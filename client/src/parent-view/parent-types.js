// @flow

import sortBy from 'lodash/sortBy';
import without from 'lodash/without';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import Button from '../share/button';
import {handleError} from '../util/error-util';
import {getUrlPrefix} from '../util/rest-util';

import type {NodeType, StateType, TypePropType, UiType} from '../types';

import './parent-types.css';

type PropsType = {
  typeNode: ?NodeType,
  ui: UiType
};

type MyStateType = {
  typeProps: TypePropType[]
};

const URL_PREFIX = getUrlPrefix();

class ParentTypes extends Component<PropsType, MyStateType> {

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
    const url = `${URL_PREFIX}type_data`;
    const options = {
      method: 'POST',
      body: JSON.stringify(typeData),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const res = await fetch(url, options);
    if (res.ok) {
      dispatch('setNewPropName', '');
      dispatch('setNewPropType', '');
    } else {
      handleError(`failed to create new property for type "${typeNode.name}"`);
    }
  };

  componentWillMount() {
    this.loadTypeProps(this.props.typeNode);
  }

  componentWillReceiveProps(nextProps) {
    const {typeNode, ui: {newPropName, newPropType}} = nextProps;
    if (!typeNode) return;

    // If a new prop was just added ...
    if (newPropName === '' && newPropType === '') {
      this.loadTypeProps(typeNode);
    }
  }

  async loadTypeProps(typeNode: ?NodeType) {
    if (!typeNode) return;

    const url = `${URL_PREFIX}types/${typeNode.id}/data`;
    const res = await fetch(url);
    if (res.ok) {
      const typeProps = await res.json();
      // $FlowFixMe
      const sortedTypeProps = sortBy(typeProps, ['name']);
      this.setState({typeProps: sortedTypeProps});
    } else {
      handleError('failed to get properties for type ' + typeNode.name);
    }
  }

  deleteProp = async (typeProp: TypePropType) => {
    const url = `${URL_PREFIX}type_data/${typeProp.id}`;
    const options = {method: 'DELETE'};
    const res = await fetch(url, options);
    if (res.ok) {
      let {typeProps} = this.state;
      typeProps = without(typeProps, typeProp);
      this.setState({typeProps});
    } else {
      handleError('failed to delete type property ' + typeProp.name);
    }
  };

  propNameChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewPropName', e.target.value);
  };

  propTypeChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewPropType', e.target.value);
  };

  renderGuts() {
    const {typeNode} = this.props;
    if (!typeNode) {
      return <div key="no-selection">Select a type from the left nav.</div>;
    }

    const {typeProps} = this.state;
    return (
      <div>
        <h3>Properties for type &quot;{typeNode.name}&quot;</h3>
        <table>
          {this.renderTableHead()}
          <tbody>
            {this.renderTableInputRow()}
            {typeProps.map(typeProp => this.renderTableRow(typeProp))}
          </tbody>
        </table>
      </div>
    );
  }

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
            onChange={this.propNameChange}
            value={newPropName}
          />
        </td>
        <td>
          <input
            type="text"
            onChange={this.propTypeChange}
            value={newPropType}
          />
        </td>
        <td>
          <Button
            className="add-prop"
            disabled={newPropName === '' || newPropType === ''}
            icon="plus"
            onClick={this.addProp}
            tooltip="add property"
          />
        </td>
      </tr>
    );
  };

  renderTableRow = (typeProp: TypePropType) => (
    <tr key={typeProp.name}>
      <td>{typeProp.name}</td>
      <td>{typeProp.kind}</td>
      <td>
        <Button
          className="delete-prop"
          icon="trash-o"
          onClick={() => this.deleteProp(typeProp)}
          tooltip="delete property"
        />
      </td>
    </tr>
  );

  render() {
    return <div className="parent-types">{this.renderGuts()}</div>;
  }
}

const mapState = (state: StateType): PropsType => {
  const {typeNodeMap, ui} = state;
  const {selectedTypeNodeId} = ui;
  const typeNode = typeNodeMap[selectedTypeNodeId];
  return {typeNode, ui};
};

export default connect(mapState)(ParentTypes);
