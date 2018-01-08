// @flow

import React from 'react';
import {connect} from 'react-redux';

import ChildInstances from './child-instances';
import ChildTypes from './child-types';

import type {StateType, TreeType} from '../types';

import './child-view.css';

type PropsType = {
  treeType: TreeType
};

const ChildView = ({treeType}: PropsType) => (
  <section className="child-view">
    {treeType === 'type' ? <ChildTypes /> : <ChildInstances />}
  </section>
);

const mapState = (state: StateType): PropsType => {
  const {treeType} = state.ui;
  return {treeType};
};

export default connect(mapState)(ChildView);
