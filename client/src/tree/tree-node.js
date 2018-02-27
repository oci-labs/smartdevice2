// @flow

import React, {Component} from 'react';
import {dispatch, dispatchSet, watch} from 'redux-easy';

//import {addNode} from './tree-util';
import {getAlertCount} from '../node/node';
//import Button from '../share/button';
import {patchJson} from '../util/rest-util';

import './tree-node.css';

import type {
  AlertType,
  NodeMapType,
  NodePayloadType,
  NodeType,
  TreeType
} from '../types';

type PropsType = {
  alerts: AlertType[],
  instanceNodeMap: NodeMapType,
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

function nodeCompare(node1: NodeType, node2: NodeType) {
  return node1.name.localeCompare(node2.name);
}

class TreeNode extends Component<PropsType> {
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

  renderAlertCount = () => {
    const {alerts, instanceNodeMap, kind, node} = this.props;
    if (kind !== 'instance') return null;

    let alertCount = getAlertCount(node, instanceNodeMap, alerts);
    //let alertCount = 999;

    // Not enough room in UI to display larger values.
    if (alertCount > 999) alertCount = '...';

    return (
      <div className="alert-count-container">
        {alertCount === 0 ? null : (
          <div className="alert-count">{alertCount}</div>
        )}
      </div>
    );
  };

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

  render = () => {
    const {
      editedName,
      //kind,
      level,
      //newNodeName,
      node,
      selectedNodeId
      //subscriptions
    } = this.props;

    if (!node.parentId) return this.renderChildren();

    const direction = node.expanded ? 'down' : 'left';
    const triangleClasses =
      node.children.length === 0 ? '' : `fa fa-caret-${direction}`;

    //const subscribed = kind === 'instance' && subscriptions.includes(node.id);
    const classes = ['tree-node', `tree-level-${level}`];
    if (node.id === selectedNodeId) classes.push('selected');

    const nameClasses = ['tree-node-name'];

    return (
      <div className={classes.join(' ')}>
        {this.renderAlertCount()}

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
          <div className={nameClasses.join(' ')} onClick={this.selectNode}>
            {/*onDoubleClick={this.toggleEdit}*/}
            {node.name}
          </div>
        )}

        {/*
        <Button
          className="add"
          disabled={newNodeName === ''}
          icon="plus"
          onClick={() => addNode(kind, newNodeName, node)}
          tooltip="add"
        />
        <Button
          className="delete"
          icon="trash-o"
          onClick={() => deleteNode(kind, node)}
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
        */}

        <div
          className={`expand ${triangleClasses}`}
          onClick={this.toggleExpand}
        />
        {node.expanded ? this.renderChildren() : null}
      </div>
    );
  };
}

export default watch(TreeNode, {alerts: '', instanceNodeMap: ''});
