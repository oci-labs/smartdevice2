// @flow

export const PATH_DELIMITER = '/';

export type TreeNodeType = {
  children: TreeNodeType[],
  expanded?: boolean,
  name: string,
  path?: string,
  type?: TreeNodeType // for instance nodes
};

/**
 * Adds a node to an existing tree
 * at a given path with a given name.
 * Returns an array containing
 * the new root node and the new node.
 */
export function addNode(
  rootNode: TreeNodeType,
  path: string,
  name: string
): TreeNodeType[] {
  if (!path) throw new Error('addNode requires path');

  const [newRootNode, node] = cloneTree(rootNode, path);

  const {children} = node;
  if (children.find(child => child.name === name)) {
    throw new Error(`duplicate child name "${name}"`);
  }

  const newNode: TreeNodeType = {
    children: [],
    name,
    path
  };
  node.children = node.children.concat(newNode);

  return [newRootNode, newNode];
}

export function cloneTree(rootNode: TreeNodeType, path: string) {
  const parts = path.split(PATH_DELIMITER);
  parts.shift(); // removes root node name

  let node = {...rootNode}; // makes a copy
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

export function deleteNode(
  rootNode: TreeNodeType,
  targetNode: TreeNodeType
): TreeNodeType {
  const {path} = targetNode;
  if (!path) throw new Error('targetNode must have path');

  const [newRootNode, node] = cloneTree(rootNode, path);
  node.children = getNodesExcept(node.children, targetNode.name);

  return newRootNode;
}

export function editNode(
  rootNode: TreeNodeType,
  targetNode: TreeNodeType,
  newName: string
): TreeNodeType {
  const {path} = targetNode;
  if (!path) throw new Error('targetNode must have path');

  const fullPath = `${path}${PATH_DELIMITER}${targetNode.name}`;
  const [newRootNode, node] = cloneTree(rootNode, fullPath);
  node.name = newName;

  return newRootNode;
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
