// @flow

export function startsUpper(s: string) {
  const firstChar = s.charAt(0);
  return 'A' <= firstChar && firstChar <= 'Z';
}
