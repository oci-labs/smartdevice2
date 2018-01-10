// @flow

/**
 * This can be used for the onKeyDown handler
 * of an HTML input to prevent entry of
 * values that are not valid JavaScript names.
 */
export function spaceHandler(e: SyntheticKeyboardEvent<HTMLInputElement>) {
  // $FlowFixMe - doesn't think target.value exists
  const {keyCode, target: {value}} = e;
  if (keyCode !== 32) return;

  // Don't allow a leading space.
  const isEmpty = value.length === 0;
  if (isEmpty) e.preventDefault();

  // Don't allow a double space.
  const lastChar = value[value.length - 1];
  if (lastChar === ' ') e.preventDefault();
}

/**
 * This can be used for the onKeyDown handler
 * of an HTML input to prevent entry of
 * values that are not valid JavaScript names.
 */
export function validNameHandler(e: SyntheticKeyboardEvent<HTMLInputElement>) {
  // $FlowFixMe - doesn't think target.value exists
  const {keyCode, target: {value}} = e;

  if (keyCode === 8) return; // backspace
  if (keyCode === 37) return; // left arrow
  if (keyCode === 39) return; // right arrow

  const isEmpty = value.length === 0;
  const isDigit = 48 <= keyCode && keyCode <= 57;
  if (isEmpty && isDigit) e.preventDefault();

  const isLetter = 65 <= keyCode && keyCode <= 90;
  if (!isLetter && !isDigit) e.preventDefault();
}
