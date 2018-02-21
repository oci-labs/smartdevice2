// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet} from 'redux-easy';

import ImportJson from '../import-json/import-json';
import {showModal} from '../share/sd-modal';
import {getUrlPrefix} from '../util/rest-util';

import type {StateType} from '../types';

import './user-dropdown.css';

type PropsType = {
  showUserDropdown: boolean
};

class UserDropdown extends Component<PropsType> {
  handleItem = (event: SyntheticEvent<HTMLElement>) => {
    dispatchSet('ui.showUserDropdown', false);

    // $FlowFixMe - doesn't know about textContent
    const {textContent} = event.target;
    if (textContent === 'Import JSON') {
      const renderFn = () => <ImportJson />;
      showModal({title: 'Import JSON Schema', renderFn});
    } else if (textContent !== 'Export JSON') {
      alert(`"${textContent}" is not implemented yet.`);
    }
  };

  render() {
    if (!this.props.showUserDropdown) return null;
    return (
      <div className="user-dropdown">
        <div onClick={this.handleItem}>Instances</div>
        <div onClick={this.handleItem}>Servers</div>
        <div onClick={this.handleItem}>Types</div>
        <div className="divider" />
        <div onClick={this.handleItem}>Import JSON</div>
        <div onClick={this.handleItem}>
          <a href={getUrlPrefix() + 'export'}>Export JSON</a>
        </div>
        <div className="divider" />
        <div onClick={this.handleItem}>Log Out</div>
      </div>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {ui: {showUserDropdown}} = state;
  return {showUserDropdown};
};

export default connect(mapState)(UserDropdown);
