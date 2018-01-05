// @flow

import React from 'react';
import {connect} from 'react-redux';

import ParentInstances from './parent-instances';
import ParentTypes from './parent-types';

import type {StateType, TreeType} from '../types';

import './parent-view.css';

type PropsType = {
  treeType: TreeType
};

const ParentView = ({treeType}: PropsType) => (
  <section className="parent-view">
    {treeType === 'type' ? <ParentTypes /> : <ParentInstances />}
  </section>
);

const mapState = (state: StateType): PropsType => {
  const {treeType} = state.ui;
  return {treeType};
};

export default connect(mapState)(ParentView);
