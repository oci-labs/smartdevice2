// @flow

import React, {Component} from 'react';
//import {dispatch} from 'redux-easy';

import type {NodeType} from '../types';

import './node.css';

type PropsType = {
  node: NodeType
};

class Node extends Component<PropsType> {

  render() {
    const {node} = this.props;
    return (
      <div className="node">
        <div className="circle">
          {node.name}
        </div>
        {node.name}
      </div>
    );
  }
}

export default Node;
