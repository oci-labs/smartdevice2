// @flow

import lowerFirst from 'lodash/lowerFirst';
import React, {Component} from 'react';
import {dispatchSet, watch} from 'redux-easy';

import ImportJson from '../import-json/import-json';
import {showModal} from '../share/sd-modal';
import {getUrlPrefix} from '../util/rest-util';

import './user-dropdown.css';

type PropsType = {
  showUserDropdown: boolean
};

const TREE_TYPES = ['instance', 'type'];
const VIEW_TYPES = ['instance', 'server', 'type'];

class UserDropdown extends Component<PropsType> {
  handleItem = (event: SyntheticEvent<HTMLElement>) => {
    dispatchSet('ui.showUserDropdown', false);

    // $FlowFixMe - doesn't know about textContent
    const {textContent} = event.target;
    const massaged = lowerFirst(textContent.slice(0, -1));

    if (VIEW_TYPES.includes(massaged)) {
      dispatchSet('ui.view', massaged);
    }

    if (TREE_TYPES.includes(massaged)) {
      dispatchSet('ui.treeType', massaged);
    }

    if (textContent === 'Import JSON') {
      const renderFn = () => <ImportJson />;
      showModal({title: 'Import JSON Schema', renderFn});
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

export default watch(UserDropdown, {
  showUserDropdown: 'ui.showUserDropdown'
});
