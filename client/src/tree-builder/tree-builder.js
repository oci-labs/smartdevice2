// @flow

import React, {Component} from 'react';
import {dispatch} from 'redux-easy';

import Button from './button';
import {PATH_DELIMITER, type TreeNodeType} from '../util/tree-util';

import './tree-builder.css';

type PropsType = {
  newNodeName: string,
  rootNode: TreeNodeType
};

function nodeCompare(node1: TreeNodeType, node2: TreeNodeType) {
  return node1.name.localeCompare(node2.name);
}

class TreeBuilder extends Component<PropsType> {
  addNode = (parent: TreeNodeType) => {
    const name = this.props.newNodeName;
    if (!name) return;

    let parentPath = parent.parentPath ?
      parent.parentPath + PATH_DELIMITER :
      '';
    parentPath += parent.name;

    dispatch('addNode', {name, parentPath});
    dispatch('setNewTypeName', '');
  };

  deleteNode = (node: TreeNodeType) => {
    dispatch('deleteNode', node);
  };

  handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewTypeName', event.target.value);
  };

  renderNodes = (nodes: TreeNodeType[], level: number = 0) =>
    //nodes.sort(nodeCompare).map(node => (
    nodes.map(node => (
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
        <Button
          className="addNode"
          label="+"
          onClick={() => this.addNode(rootNode)}
        />
        {this.renderNodes(rootNode.children)}
      </div>
    );
  }
}

export default TreeBuilder;
