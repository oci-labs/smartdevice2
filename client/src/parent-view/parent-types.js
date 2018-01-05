// @flow

//import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import Button from '../share/button';
import {handleError} from '../util/error-util';
import {getUrlPrefix} from '../util/rest-util';

import type {NodeType, StateType, UiType} from '../types';

import './parent-types.css';

type PropsType = {
  typeNode: ?NodeType,
  ui: UiType
};

const URL_PREFIX = getUrlPrefix();

class ParentTypes extends Component<PropsType> {

  addProp = () => {
    console.log('parent-types.js addProp: entered');
  };

  async componentWillReceiveProps(nextProps) {
    const {typeNode} = nextProps;
    if (!typeNode) return;

    const oldTypeNode = this.props.typeNode;
    if (oldTypeNode && typeNode.id === oldTypeNode.id) return;

    const url = `${URL_PREFIX}types/${typeNode.id}/data`;
    const res = await fetch(url);
    if (res.ok) {
      const typeProps = await res.json();
      console.log('parent-types.js x: typeProps =', typeProps);
    } else {
      handleError('failed to get properties for type ' + typeNode.name);
    }
  }

  deleteProp = () => {
    console.log('parent-types.js deleteProp: entered');
  };

  propNameChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewPropName', e.target.value);
  };

  propTypeChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewPropType', e.target.value);
  };

  renderGuts() {
    const {typeNode, ui} = this.props;
    if (!typeNode) {
      return <div key="no-selection">Select a type from the left nav.</div>;
    }

    const {newPropName, newPropType} = ui;

    return (
      <div>
        <h3>Properties for type &quot;{typeNode.name}&quot;</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Data Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
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
                <Button
                  className="delete-prop"
                  icon="trash-o"
                  onClick={this.deleteProp}
                  tooltip="delete property"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

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
