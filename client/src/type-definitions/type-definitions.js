// @flow

import React, {Component} from 'react';
import {watch} from 'redux-easy';

import Button from '../share/button';
import {showPrompt} from '../share/sd-modal';
import {createNode, deleteNode} from '../tree/tree-util';
import TypeAlerts from '../type-alerts/type-alerts';
import TypeProperties from '../type-properties/type-properties';

import type {NodeMapType, UiType} from '../types';

import './type-definitions.css';

type PropsType = {
  typeNodeMap: NodeMapType,
  ui: UiType
};

class TypeDefinitions extends Component<PropsType> {
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

  deleteType = () => {
    const typeNode = this.getTypeNode(this.props);
    deleteNode('type', typeNode);
  };

  getTypeNode = (props: PropsType) => {
    const {typeNodeMap, ui: {selectedTypeNodeId}} = props;
    return typeNodeMap[selectedTypeNodeId];
  };

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

  render() {
    const typeNode = this.getTypeNode(this.props);
    if (!typeNode) {
      return (
        <section>
          <div className="message">Select a type in the left nav.</div>
        </section>
      );
    }

    return (
      <section className="type-definitions">
        <header>
          <div className="title">
            {typeNode.name}
            {this.propertyButtons()}
          </div>
          {this.breadcrumbs(typeNode)}
        </header>
        <section>
          <TypeProperties />
          <TypeAlerts />
        </section>
      </section>
    );
  }
}

export default watch(TypeDefinitions, {
  typeNodeMap: '',
  ui: ''
});
