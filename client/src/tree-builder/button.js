// @flow

import React from 'react';

import './button.css';

type PropsType = {
  className: string,
  icon?: string,
  label?: string,
  onClick: Function
};

export default ({className, icon, label = '', onClick}: PropsType) => {
  let classes = `button ${className}`;
  if (icon) classes += ` fa fa-${icon}`;
  return (
    <div className={classes} onClick={onClick}>
      {label}
    </div>
  );
};
