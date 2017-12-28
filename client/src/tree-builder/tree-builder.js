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

    let path = parent.path ?
      parent.path + PATH_DELIMITER :
      '';
    path += parent.name;

    try {
      dispatch('addNode', {name, path});
      dispatch('setNewTypeName', '');
    } catch (e) {
      console.error('tree-builder.js addNode:', e.message);
    }
  };

  deleteNode = (node: TreeNodeType) => {
    dispatch('deleteNode', node);
  };

  editNode = (node: TreeNodeType) => {
    console.log('tree-builder.js editNode: node.name =', node.name);
    dispatch('editNode', node);
  };

  handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    dispatch('setNewTypeName', event.target.value);
  };

  renderNodes = (nodes: TreeNodeType[], level: number = 0) => {
    const copy = [...nodes].sort(nodeCompare);
    return copy.map(node => (
      <div className={'tree-node tree-level-' + level} key={node.name}>
        <div className="tree-node-name">{node.name}</div>
        <Button
          className="addNode"
          icon="plus"
          onClick={() => this.addNode(node)}
        />
        <Button
          className="deleteNode"
          icon="trash-o"
          onClick={() => this.deleteNode(node)}
        />
        <Button
          className="editNode"
          icon="pencil"
          onClick={() => this.editNode(node)}
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
        <Button
          className="addNode"
          icon="plus"
          onClick={() => this.addNode(rootNode)}
        />
        {this.renderNodes(rootNode.children)}
      </div>
    );
  }
}

export default TreeBuilder;
