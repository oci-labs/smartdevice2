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
 * Returns a cloned version of a tree where a new node
 * with a given name is added at a given path.
 * Also returns the new node.
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

/**
 * Creates a copy of a given tree where
 * new versions of all nodes along a given path
 * are created so the caller can safely modify them.
 */
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

/**
 * Returns a cloned version of a tree where a given node is deleted.
 */
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

/**
 * Returns a cloned version of a tree where a given node
 * is replaced by a new node with a given name.
 * Also returns the new node.
 */
export function editNode(
  rootNode: TreeNodeType,
  targetNode: TreeNodeType,
  newName: string
): TreeNodeType[] {
  const {path} = targetNode;
  if (!path) throw new Error('targetNode must have path');

  const fullPath = `${path}${PATH_DELIMITER}${targetNode.name}`;
  const [newRootNode, newNode] = cloneTree(rootNode, fullPath);
  newNode.name = newName;

  // Return both the new root node and the new version of the edited node.
  return [newRootNode, newNode];
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
