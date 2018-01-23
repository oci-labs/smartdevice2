// @flow

export function entries<T, U>(obj: {[key: T]: U}): [T, U][] {
  return ((Object.entries(obj): any): [T, U][]);
}

export function getElementById(id: string): Element {
  return ((document.getElementById(id): any): Element);
}

export function keys<T, U>(obj: {[key: T]: U}): T[] {
  return ((Object.keys(obj): any): T[]);
}

export function values<T, U>(obj: {[key: T]: U}): U[] {
  return ((Object.values(obj): any): U[]);
}
