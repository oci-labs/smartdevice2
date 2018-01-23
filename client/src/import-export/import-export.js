// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import Button from '../share/button';
import {hideModal, showModal} from '../share/sd-modal';
import {postJson} from '../util/rest-util';

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

  export = () => {
    alert('JSON export is not implemented yet.');
    this.clear();
  };

  import = () => {
    const {file} = this.state;
    if (!file) return;

    const reader = new FileReader();

    reader.onload = event => {
      const json = event.target.result;

      try {
        postJson('load', JSON.parse(json));
      } catch (e) {
        showModal({
          error: true,
          title: 'JSON Upload Error',
          message: e.message
        });
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
        <label>JSON File</label>
        {/*
        <Input
          path="ui.jsonPath"
          type="file"
          accept=".json"
          onChange={this.loadFile}
        />
        */}
        <input type="file" onChange={this.loadFile} />
        <div>
          <Button onClick={this.import} disabled={disabled}>
            Import
          </Button>
          <Button onClick={this.export} disabled={disabled}>
            Export
          </Button>
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
