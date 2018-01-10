// @flow

import capitalize from 'lodash/capitalize';
import React, {Component} from 'react';
import {dispatch} from 'redux-easy';
import {getType} from '../tree/tree-util';

import type {NodeType} from '../types';

import './node.css';

type PropsType = {
  isSelected: boolean,
  node: NodeType
};

class Node extends Component<PropsType> {
  select = () => {
    const {node} = this.props;
    dispatch('setSelectedChildNode', node);
  };

  render() {
    const {isSelected, node} = this.props;
    let className = 'node';
    if (isSelected) className += ' selected';

    return (
      <div className={className} onClick={this.select}>
        <div className="circle">{node.name}</div>
        {capitalize(getType(node))}
      </div>
    );
  }
}

export default Node;
