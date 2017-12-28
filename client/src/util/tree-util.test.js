// @flow

import initialState from '../initial-state';
import {
  PATH_DELIMITER,
  cloneTree,
  findNode,
  getFirstPathPart,
  getNodesExcept
} from './tree-util';

import type {StateType, TreeNodeType} from '../types';

describe('tree-util', () => {
  function getNodes(): TreeNodeType[] {
    return [
      {children: [], expanded: true, name: 'A'},
      {children: [], expanded: true, name: 'B'},
      {children: [], expanded: true, name: 'C'}
    ];
  }

  test('cloneTree empty', () => {
    const state: StateType = initialState;
    const path = 'typeRootNode';
    const [newRoot, node] = cloneTree(state, path);
    expect(newRoot.name).toBe(path);
    expect(node.name).toBe(path);
  });

  test('cloneTree non-empty', () => {
    const state: StateType = initialState;

    const name1 = 'typeRootNode';
    const name2 = 'foo';
    const name3 = 'bar';

    const d = PATH_DELIMITER;
    const path = `${name1}${d}${name2}${d}${name3}`;

    let node = {
      children: [],
      expanded: true,
      name: name3,
      parentPath: `${name1}${d}${name2}`
    };
    node = {
      children: [node],
      expanded: true,
      name: name2,
      parentPath: name1
    };
    state[name1].children.push(node);

    const [newRoot, lastNode] = cloneTree(state, path);
    expect(newRoot.name).toBe(name1);
    expect(newRoot.children[0].name).toBe(name2);
    expect(newRoot.children[0].children[0].name).toBe(name3);
    expect(lastNode.name).toBe(name3);
    expect(lastNode).toEqual(newRoot.children[0].children[0]);
  });

  test('cloneTree root node not found', () => {
    const state: StateType = initialState;
    const path = 'bad/wrong';
    expect(() => cloneTree(state, path)).toThrow(
      `no root node found at "${path}"`
    );
  });

  test('cloneTree bad path', () => {
    const state: StateType = initialState;
    const path = 'typeRootNode/bad';
    expect(() => cloneTree(state, path)).toThrow(`bad tree path "${path}"`);
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
