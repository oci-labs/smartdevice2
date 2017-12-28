// @flow

import type {StateType, TreeNodeType} from '../types';

export const PATH_DELIMITER = '/';

export function cloneTree(state: StateType, path: string) {
  const parts = path.split(PATH_DELIMITER);
  const firstPart = parts.shift();
  let node = state[firstPart];
  if (!node) throw new Error(`no root node found at "${path}"`);

  node = {...node}; // makes a copy
  const newRoot = node;

  // Walk down the tree creating copies of all nodes in the path.
  for (const part of parts) {
    // Find the child that matches the next path part.
    const {children} = node;
    const child = findNode(children, part);
    if (!child) throw new Error(`bad tree path "${path}"`);

    // Create a new array of children where
    // the one at the current path part is a copy.
    const newChildren = getNodesExcept(children, child.name);
    const newChild = {...child}; // makes a copy
    newChildren.push(newChild);

    node.children = newChildren;
    node = newChild; // move down the tree
  }

  // Return both the new root node and the last node copied.
  // Callers can add or delete a child in the last node copied.
  return [newRoot, node];
}

export function findNode(nodes: TreeNodeType[], name: string): ?TreeNodeType {
  return nodes.find(node => node.name === name);
}

export function getFirstPathPart(path: string) {
  if (!path) throw new Error('path is required');
  return path.split(PATH_DELIMITER).shift();
}

export function getNodesExcept(nodes: TreeNodeType[], except: string) {
  return nodes.filter(node => node.name !== except);
}
