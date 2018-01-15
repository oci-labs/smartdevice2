// @flow

import React, {Component} from 'react';
import {dispatch, dispatchSet} from 'redux-easy';

import {addNode} from './tree-util';
import Button from '../share/button';
import {showConfirm} from '../share/sd-modal';
import {deleteResource, getJson, patchJson} from '../util/rest-util';

import './tree-node.css';

import type {NodeMapType, NodePayloadType, NodeType, TreeType} from '../types';

type PropsType = {
  editedName: string,
  editingNode: ?NodeType,
  kind: TreeType,
  level: number,
  newNodeName: string,
  node: NodeType,
  nodeMap: NodeMapType,
  selectedNodeId: number,
  subscriptions: number[]
};

function getSortedChildren(node: NodeType, nodeMap: NodeMapType): NodeType[] {
  const children = node.children.map(id => nodeMap[id]);
  return children.sort(nodeCompare);
}

async function hasDependents(kind: TreeType, id: number): Promise<boolean> {
  const inUse = await getJson(`${kind}s/${id}/inuse`);
  return inUse;
}

function nodeCompare(node1: NodeType, node2: NodeType) {
  return node1.name.localeCompare(node2.name);
}

class TreeNode extends Component<PropsType> {
  deleteNode = async (node: NodeType) => {
    const {kind} = this.props;

    const doDelete = async () => {
      await deleteResource(`tree/${kind}/${node.id}`);
      const payload: NodePayloadType = {kind, node};
      dispatch('deleteNode', payload);
    };

    // Determine if any other nodes refer to this one.
    const inUse = await hasDependents(kind, node.id);
    if (inUse) {
      showConfirm({
        title: 'Node In Use',
        message:
        'Are you sure you want to delete this node?\n' +
        'At least one other node refers to it.',
        yesCb: () => doDelete(),
        noCb: () => {}
      });
    } else {
      doDelete();
    }
  };

  editNode = (event: SyntheticInputEvent<HTMLInputElement>) =>
    dispatchSet('ui.editedName', event.target.value);

  handleEscape = (event: SyntheticInputEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') this.toggleEdit();
  };

  isEditing = (node: NodeType) => node === this.props.editingNode;

  moveCursor = (event: SyntheticInputEvent<HTMLInputElement>) => {
    const {target} = event;
    const {value} = target;
    target.selectionStart = value.length;
  };

  saveChange = async () => {
    const {editedName: name, editingNode, kind, node} = this.props;
    if (!editingNode) return;

    await patchJson(`tree/${kind}/${editingNode.id}`, {name});
    const newNode = {...node, name};
    const payload: NodePayloadType = {kind, node: newNode};
    dispatch('saveNode', payload);
  };

  selectNode = () => {
    const {kind, node} = this.props;
    const payload: NodePayloadType = {kind, node};
    dispatch('setSelectedNode', payload);
    dispatch('setSelectedChildNodeId', node.id);
  };

  toggleEdit = () => dispatch('toggleEditNode', this.props.node);

  toggleExpand = () => {
    const {kind, node} = this.props;
    dispatch('toggleExpandNode', {kind, node});
  };

  toggleSubscribe = () => dispatch('toggleSubscribeNode', this.props.node);

  renderChildren = () => {
    const {level, node, nodeMap} = this.props;
    return getSortedChildren(node, nodeMap).map(child => (
      <TreeNode
        {...this.props}
        key={'tn' + child.id}
        level={level + 1}
        node={child}
      />
    ));
  };

  render = () => {
    const {
      editedName,
      kind,
      level,
      newNodeName,
      node,
      selectedNodeId,
      subscriptions
    } = this.props;

    if (!node.parentId) return this.renderChildren();

    const direction = node.expanded ? 'down' : 'right';
    const triangleClasses =
      node.children.length === 0 ? '' : `fa fa-caret-${direction}`;

    const subscribed = kind === 'instance' && subscriptions.includes(node.id);
    const classes = ['tree-node', `tree-level-${level}`];
    if (node.id === selectedNodeId) classes.push('selected');

    return (
      <div className={classes.join(' ')}>
        <div
          className={`expand ${triangleClasses}`}
          onClick={this.toggleExpand}
        />
        {this.isEditing(node) ? (
          <input
            type="text"
            autoFocus
            onBlur={this.saveChange}
            onChange={this.editNode}
            onFocus={this.moveCursor}
            onKeyDown={this.handleEscape}
            value={editedName}
          />
        ) : (
          <div className="tree-node-name" onClick={this.selectNode}>
            {/*onDoubleClick={this.toggleEdit}*/}
            {node.name}
          </div>
        )}
        <Button
          className="add-node"
          disabled={newNodeName === ''}
          icon="plus"
          onClick={() => addNode(kind, newNodeName, node)}
          tooltip="add"
        />
        <Button
          className="delete-node"
          icon="trash-o"
          onClick={() => this.deleteNode(node)}
          tooltip="delete"
        />
        <Button
          className="edit-node"
          icon="pencil"
          onClick={() => this.toggleEdit()}
          tooltip="edit"
        />
        {kind === 'instance' ? (
          <Button
            className={`subscribe-node ${subscribed ? 'subscribed' : ''}`}
            icon="binoculars"
            onClick={() => this.toggleSubscribe()}
            tooltip="subscribe"
          />
        ) : null}
        {node.expanded ? this.renderChildren() : null}
      </div>
    );
  };
}

export default TreeNode;
