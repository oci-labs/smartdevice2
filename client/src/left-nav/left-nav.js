// @flow

import {upperFirst} from 'lodash/string';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import TreeBuilder from '../tree/tree-builder';

import type {NodeMapType, StateType, TreeType, UiType} from '../types';

import './left-nav.css';

type PropsType = {
  instanceNodeMap: NodeMapType,
  subscriptions: number[],
  treeType: TreeType,
  typeNodeMap: NodeMapType,
  ui: UiType
};

class LeftNav extends Component<PropsType> {

  getTree = () => {
    const {
      instanceNodeMap,
      subscriptions,
      typeNodeMap,
      ui
    } = this.props;
    const {
      editedName,
      editingNode,
      instanceName,
      typeName,
      treeType
    } = ui;

    const isType = treeType === 'type';
    const newNodeName = isType ? typeName : instanceName;
    const nodeMap = isType ? typeNodeMap : instanceNodeMap;
    const prop = `selected${upperFirst(treeType)}NodeId`;
    const selectedNodeId = ui[prop];

    return (
      <TreeBuilder
        editedName={editedName}
        editingNode={editingNode}
        kind={treeType}
        newNodeName={newNodeName}
        nodeMap={nodeMap}
        selectedNodeId={selectedNodeId}
        subscriptions={subscriptions}
      />
    );
  };

  treeTypeChange = (e: SyntheticInputEvent<HTMLInputElement>) =>
    dispatch('setTreeType', e.target.value);

  render() {
    const {treeType} = this.props.ui;

    return (
      <section className="left-nav">
        <div className="tree-radio">
          <input
            type="radio"
            value="type"
            name="treeType"
            checked={treeType === 'type'}
            onChange={this.treeTypeChange}
          />
          Type
          <input
            type="radio"
            value="instance"
            name="treeType"
            checked={treeType === 'instance'}
            onChange={this.treeTypeChange}
          />
          Instance
        </div>
        {this.getTree()}
      </section>
    );
  }
}

const mapState = (state: StateType): Object => {
  const {
    instanceNodeMap,
    typeNodeMap,
    ui,
    user: {subscriptions}
  } = state;
  return {
    instanceNodeMap,
    subscriptions,
    typeNodeMap,
    ui
  };
};

export default connect(mapState)(LeftNav);
