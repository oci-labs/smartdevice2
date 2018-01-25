// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

import Button from '../share/button';
import {hideModal, showModal} from '../share/sd-modal';
import {getUrlPrefix, postJson} from '../util/rest-util';

import type {StateType} from '../types';

import './import-export.css';

type PropsType = {};
type MyStateType = {
  file: ?File
};

class ImportExport extends Component<PropsType, MyStateType> {
  state: MyStateType = {file: null};

  clear = () => {
    this.setState({file: null});
    hideModal();
  };

  import = () => {
    const {file} = this.state;
    if (!file) return;

    global.importInProgress = true;

    const reader = new FileReader();

    reader.onload = event => {
      const json = event.target.result;

      try {
        postJson('import', JSON.parse(json));

        // Clear enough state from Redux
        // to force it to be reloaded
        // using the new data in the database.
        dispatch('clear');
      } catch (e) {
        showModal({
          error: true,
          title: 'JSON Import Error',
          message: e.message
        });
      } finally {
        global.importInProgress = true;
      }

      this.clear();
    };

    reader.readAsText(file);
  };

  // eslint-disable-next-line prefer-destructuring
  loadFile = event => this.setState({file: event.target.files[0]});

  render() {
    const disabled = !this.state.file;
    return (
      <section className="import-export">
        <div>
          <label>JSON File</label>
          <input type="file" onChange={this.loadFile} />
          <Button onClick={this.import} disabled={disabled}>
            Import
          </Button>
        </div>
        <div>
          <a href={getUrlPrefix() + 'export'}>
            <Button>Export</Button>
          </a>
          <Button onClick={this.clear}>Cancel</Button>
        </div>
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {ui: {jsonPath}} = state;
  return {jsonPath};
};

export default connect(mapState)(ImportExport);
