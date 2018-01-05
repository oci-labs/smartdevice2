// @flow

import React from 'react';

import './button.css';

type PropsType = {
  className?: string,
  disabled?: boolean,
  icon?: string,
  label?: string,
  onClick: Function,
  tooltip: string
};

export default ({
  className,
  disabled,
  icon,
  label = '',
  onClick,
  tooltip
}: PropsType) => {
  let classes = 'button';
  if (className) classes += ` ${className}`;
  if (icon) classes += ` fa fa-${icon}`;
  if (disabled) classes += ' disabled';
  return (
    <div className={classes} onClick={onClick} title={tooltip}>
      {label}
    </div>
  );
};
