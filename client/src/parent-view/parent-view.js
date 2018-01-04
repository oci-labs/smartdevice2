// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
//import {dispatch} from 'redux-easy';

import type {StateType} from '../types';

import './parent-view.css';

type PropsType = {};

class ParentView extends Component<PropsType> {
  render() {
    return (
      <section className="parent-view">
        Parent View
      </section>
    );
  }
}

const mapState = (state: StateType): Object => {
  return {};
};

export default connect(mapState)(ParentView);
