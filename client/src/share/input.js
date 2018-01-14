// @flow

import React from 'react';
import {dispatchSet, getPathValue} from 'redux-easy';

type PropsType = {
  path: string,
  type: string
};

class Input extends React.Component<PropsType> {
  handleChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
    const {checked, value} = event.target;
    const {path, type} = this.props;
    dispatchSet(path, type === 'checkbox' ? checked : value);
  };

  render() {
    const {path, type} = this.props;
    const value = getPathValue(path);
    const propName = type === 'checkbox' ? 'checked' : 'value';
    const inputProps = {...this.props, [propName]: value};
    return <input {...inputProps} onChange={this.handleChange} />;
  }
}

export default Input;
