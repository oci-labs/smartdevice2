// @flow

/**
 * This can be used for the onKeyDown handler
 * of an HTML input that should only allow entry
 * of host names and IP addresses.
 */
export function hostHandler(e: SyntheticKeyboardEvent<HTMLInputElement>) {
  const {keyCode} = e;

  if (
    !isNavigation(keyCode) &&
    !isDash(keyCode) &&
    !isDigit(keyCode) &&
    !isLetter(keyCode) &&
    !isPeriod(keyCode)
  ) e.preventDefault();
}

function isDash(keyCode: number): boolean {
  return keyCode === 189;
}

function isDigit(keyCode: number): boolean {
  return 48 <= keyCode && keyCode <= 57;
}

export function isHostName(value: string) {
  return /^[A-Za-z0-9-.]+$/.test(value);
}

export function isIpAddress(value: string) {
  const parts = value.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const n = Number(part);
    return !Number.isNaN(n) && 0 <= n && n <= 255;
  });
}

function isLetter(keyCode: number): boolean {
  return 65 <= keyCode && keyCode <= 90;
}

// backspace, left arrow, right arrow
const NAVIGATION_KEY_CODES = [8, 37, 39];

function isNavigation(keyCode: number): boolean {
  return NAVIGATION_KEY_CODES.includes(keyCode);
}

function isPeriod(keyCode: number): boolean {
  return keyCode === 190;
}

/**
 * This returns a boolean indicating whether
 * a string of JavaScript code is "safe".
 * It determines this by looking for function calls.
 */
export function isSafeCode(jsCode: string) {
  // A function call is ...
  // one or more word characters,
  // followed by zero or more whitespace characters,
  // followed by a left paren.
  const re = /\w+\s*\(/;
  return !re.test(jsCode);
}

function isSpace(keyCode: number): boolean {
  return keyCode === 32;
}

/**
 * This can be used for the onKeyDown handler
 * of an HTML input to prevent entry of
 * values that begin with a space or contain
 * multiple, consecutive spaces.
 */
export function spaceHandler(e: SyntheticKeyboardEvent<HTMLInputElement>) {
  // $FlowFixMe - doesn't think target.value exists
  const {keyCode, target: {value}} = e;
  if (isSpace(keyCode)) return;

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

  if (isNavigation(keyCode)) return;

  const isEmpty = value.length === 0;
  if (isEmpty && isDigit(keyCode)) e.preventDefault();

  if (!isLetter(keyCode) && !isDigit(keyCode)) e.preventDefault();
}
