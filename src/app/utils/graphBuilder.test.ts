import { describe, it, expect } from 'vitest';
import { getLayoutedElements } from './layout';

describe('getLayoutedElements', () => {
  it('positions nodes using Dagre', () => {
    const nodes = [
      { id: 'A', position: { x: 0, y: 0 }, data: { label: 'A' }, type: 'default' },
      { id: 'B', position: { x: 0, y: 0 }, data: { label: 'B' }, type: 'default' },
    ];
    const edges = [{ id: 'e1', source: 'A', target: 'B' }];

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);

    expect(layoutedNodes.length).toBe(2);
    expect(layoutedEdges.length).toBe(1);
    layoutedNodes.forEach((node) => {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
    });
  });
});