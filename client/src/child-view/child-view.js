// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
//import {dispatch} from 'redux-easy';

import type {StateType} from '../types';

import './child-view.css';

type PropsType = {};

class ChildView extends Component<PropsType> {
  render() {
    return (
      <section className="child-view">
        Child View
      </section>
    );
  }
}

const mapState = (state: StateType): Object => {
  return {};
};

export default connect(mapState)(ChildView);
