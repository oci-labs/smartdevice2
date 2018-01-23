// @flow

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Input} from 'redux-easy';

import Button from '../share/button';
import {hideModal} from '../share/sd-modal';
import {getJson} from '../util/rest-util';

import type {StateType} from '../types';

import './import-export.css';

type PropsType = {
  jsonPath: string
};

class ImportExport extends Component<PropsType> {

  cancel = () => hideModal();

  export = () => {
    alert('JSON export is not implemented yet.');
    hideModal();
  };

  import = async () => {
    const url = 'load/' + this.props.jsonPath;
    console.log('import-export.js import: url =', url);
    await getJson(url);
    hideModal();
  };

  render() {
    const {jsonPath} = this.props;
    const disabled = !jsonPath;
    return (
      <section className="import-export">
        <label>JSON Path</label>
        <Input path="ui.jsonPath" />
        <div>
          <Button onClick={this.import} disabled={disabled}>Import</Button>
          <Button onClick={this.export} disabled={disabled}>Export</Button>
          <Button onClick={this.cancel}>Cancel</Button>
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
