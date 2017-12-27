// @flow

import React, {Component} from 'react';
import {dispatch} from 'redux-easy';

import Button from './button';

import './tree-builder.css';

import type {AddNodePayloadType, TreeNodeType} from '../types';

type PropsType = {
  newNodeName: string,
  rootNode: TreeNodeType,
  rootPropertyName: string
};

class TreeBuilder extends Component<PropsType> {
  addNode = (parent: ?TreeNodeType) => {
    const {newNodeName, rootPropertyName} = this.props;
    if (!newNodeName) return;

    const payload: AddNodePayloadType = {
      name: newNodeName,
      parent: parent || this.props.rootNode,
      rootPropertyName
    };
    dispatch('addNode', payload);
    dispatch('setNewNodeName', '');
  };

  deleteNode = (node: TreeNodeType) => {
    console.log('tree-builder.js deleteNode: entered');
    dispatch('deleteNode', node);
  };

  handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewNodeName', event.target.value);
  };

  renderNodes = (nodes: TreeNodeType[], level: number = 0) => {
    console.log('tree-builder.js renderNodes: nodes =', nodes);
    return nodes.map(node => (
      <div className={'tree-node tree-level-' + level} key={node.name}>
        <div className="tree-node-name">{node.name}</div>
        <Button
          className="addNode"
          label="+"
          onClick={() => this.addNode(node)}
        />
        <Button
          className="deleteNode"
          label="-"
          onClick={() => this.deleteNode(node)}
        />
        {this.renderNodes(node.children, level + 1)}
      </div>
    ));
  };

  render() {
    const {newNodeName, rootNode} = this.props;
    return (
      <div className="tree-builder">
        <div>
          <label>New Type</label>
          <input
            type="text"
            autoFocus
            onChange={this.handleChange}
            value={newNodeName}
          />
        </div>
        <Button className="addNode" label="+" onClick={() => this.addNode()} />
        {this.renderNodes(rootNode.children)}
      </div>
    );
  }
}

export default TreeBuilder;
