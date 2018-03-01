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

const TREE_TYPES = ['Instances', 'Types'];
const VIEW_TYPES = ['Enums', 'Instances', 'Servers', 'Train Control', 'Types'];

class UserDropdown extends Component<PropsType> {

  handleItem = (event: SyntheticEvent<HTMLElement>) => {
    dispatchSet('ui.showUserDropdown', false);

    // $FlowFixMe - doesn't know about textContent
    const view = event.target.textContent;

    if (VIEW_TYPES.includes(view)) {
      dispatchSet('ui.view', view);
    }

    if (TREE_TYPES.includes(view)) {
      const treeType = lowerFirst(view.slice(0, -1));
      dispatchSet('ui.treeType', treeType);
    }

    if (view === 'Import JSON') {
      const renderFn = () => <ImportJson />;
      showModal({title: 'Import JSON Schema', renderFn});
    }
  };

  render() {
    if (!this.props.showUserDropdown) return null;
    return (
      <div className="user-dropdown">
        <div onClick={this.handleItem}>Servers</div>
        <div onClick={this.handleItem}>Enums</div>
        <div onClick={this.handleItem}>Types</div>
        <div onClick={this.handleItem}>Instances</div>
        <div className="divider" />
        <div onClick={this.handleItem}>Import JSON</div>
        <div onClick={this.handleItem}>
          <a href={getUrlPrefix() + 'export'}>Export JSON</a>
        </div>
        <div className="divider" />
        <div onClick={this.handleItem}>Train Control</div>
        <div className="divider" />
        <div onClick={this.handleItem}>Log Out</div>
      </div>
    );
  }
}

export default watch(UserDropdown, {
  showUserDropdown: 'ui.showUserDropdown'
});
