// @flow

import React from 'react';

import './button.css';

type PropsType = {
  className: string,
  label: string,
  onClick: Function
};

export default ({className, label, onClick}: PropsType) => (
  <div className={`button ${className}`} onClick={onClick}>
    {label}
  </div>
);
