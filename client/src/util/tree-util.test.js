// @flow

import {deepFreeze} from './object-util';
import {
  PATH_DELIMITER,
  addNode,
  cloneTree,
  deleteNode,
  editNode,
  findNode,
  getFirstPathPart,
  getNodesExcept,
  type TreeNodeType
} from './tree-util';
import initialState from '../initial-state';

import type {StateType} from '../types';

describe('tree-util', () => {
  let state: StateType;

  beforeEach(() => {
    state = initialState;
    deepFreeze(state);
  });

  function getNodes(): TreeNodeType[] {
    return [
      {children: [], name: 'A'},
      {children: [], name: 'B'},
      {children: [], name: 'C'}
    ];
  }

  test('addNode', () => {
    const rootName = 'typeRootNode';
    const rootNode = state[rootName];

    const path = rootName;
    const name = 'new node';
    const [newRootNode] = addNode(rootNode, path, name);

    const {children} = newRootNode;
    expect(children.length).toBe(1);
    const [child] = children;
    expect(child.name).toBe(name);
  });

  test('addNode without path', () => {
    const rootNode: TreeNodeType = {children: [], name: 'root'};
    const path = '';
    const name = 'some name';
    expect(() => addNode(rootNode, path, name)).toThrow();
  });

  test('addNode duplicate child name', () => {
    const rootName = 'typeRootNode';
    const rootNode = state[rootName];

    const path = rootName;
    const name = 'new node';
    const [newRootNode] = addNode(rootNode, path, name);
    expect(() => addNode(newRootNode, path, name)).toThrow(
      `duplicate child name "${name}"`
    );
  });

  test('cloneTree empty', () => {
    const rootName = 'typeRootNode';
    const rootNode = state[rootName];
    const [newRoot, node] = cloneTree(rootNode, rootName);
    expect(newRoot.name).toBe(rootName);
    expect(node.name).toBe(rootName);
  });

  test('cloneTree non-empty', () => {
    const name1 = 'typeRootNode';
    const name2 = 'foo';
    const name3 = 'bar';

    const d = PATH_DELIMITER;
    const path = `${name1}${d}${name2}${d}${name3}`;

    let node = {
      children: [],
      name: name3,
      path: `${name1}${d}${name2}`
    };
    node = {
      children: [node],
      name: name2,
      path: name1
    };
    const rootNode = {
      children: [node],
      name: name1
    };

    const [newRoot, lastNode] = cloneTree(rootNode, path);
    expect(newRoot.name).toBe(name1);
    expect(newRoot.children[0].name).toBe(name2);
    expect(newRoot.children[0].children[0].name).toBe(name3);
    expect(lastNode.name).toBe(name3);
    expect(lastNode).toEqual(newRoot.children[0].children[0]);
  });

  test('cloneTree bad path', () => {
    const rootName = 'typeRootNode';
    const rootNode = state[rootName];
    const path = `${rootName}/bad`;
    expect(() => cloneTree(rootNode, path)).toThrow(`bad tree path "${path}"`);
  });

  test('deleteNode', () => {
    const rootName = 'typeRootNode';
    const rootNode = state[rootName];

    const path = rootName;
    const name = 'new node';
    let [newRootNode] = addNode(rootNode, path, name);

    const targetNode = {children: [], name, path};
    newRootNode = deleteNode(newRootNode, targetNode);

    const {children} = newRootNode;
    expect(children.length).toBe(0);
  });

  test('deleteNode without path', () => {
    const rootNode: TreeNodeType = {children: [], name: 'root'};
    const targetNode: TreeNodeType = {
      children: [],
      name: 'some name',
      path: ''
    };

    expect(() => deleteNode(rootNode, targetNode)).toThrow(
      'targetNode must have path'
    );
  });

  test('editNode', () => {
    const rootName = 'typeRootNode';
    const rootNode1 = state[rootName];

    const path = rootName;
    const name = 'some name';
    const [rootNode2, node] = addNode(rootNode1, path, name);

    const newName = 'some new name';
    const [rootNode3] = editNode(rootNode2, node, newName);
    expect(rootNode3).toBeDefined();
    expect(rootNode3.children[0].name).toBe(newName);
  });

  test('findNode when found', () => {
    const nodes = getNodes();
    const node = findNode(nodes, 'B');
    expect(node).toBeDefined();
    if (node) expect(node.name).toBe('B');
  });

  test('findNode when not found', () => {
    const nodes = getNodes();
    const node = findNode(nodes, 'D');
    expect(node).not.toBeDefined();
  });

  test('getFirstPathPart when found', () => {
    const first = 'foo';
    const d = PATH_DELIMITER;
    const path = `${first}${d}bar${d}baz`;
    const part = getFirstPathPart(path);
    expect(part).toBe(first);
  });

  test('getFirstPathPart when not found', () => {
    expect(() => getFirstPathPart('')).toThrow('path is required');
  });

  test('getNodesExcept when found', () => {
    const nodes = getNodes();
    const newNodes = getNodesExcept(nodes, 'B');
    expect(newNodes.length).toBe(2);
    const names = newNodes.map(node => node.name);
    expect(names).toContain('A');
    expect(names).toContain('C');
  });

  test('getNodesExcept when not', () => {
    const nodes = getNodes();
    const newNodes = getNodesExcept(nodes, 'D');
    expect(newNodes.length).toBe(3);
    const names = newNodes.map(node => node.name);
    expect(names).toContain('A');
    expect(names).toContain('B');
    expect(names).toContain('C');
  });
});
