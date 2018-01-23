// @flow

import React, {type Node} from 'react';

import './button.css';

type PropsType = {
  className?: string,
  children?: Node,
  disabled?: boolean,
  icon?: string,
  onClick: Function,
  tooltip?: string
};

export default ({
  className,
  children,
  disabled,
  icon,
  onClick,
  tooltip
}: PropsType) => {
  let classes = 'button';
  if (className) classes += ` ${className}`;
  if (icon) classes += ` fa fa-${icon}`;
  if (disabled) classes += ' disabled';
  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      title={tooltip}
    >
      {children}
    </button>
  );
};
