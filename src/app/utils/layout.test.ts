import { describe, it, expect } from 'vitest';
import { getLayoutedElements } from './layout';
import type { Node, Edge } from 'reactflow';

describe('getLayoutedElements', () => {
  it('positions nodes using Dagre', () => {
    const nodes: Node[] = [
      { id: 'A', position: { x: 0, y: 0 }, data: { label: 'A' }, type: 'default' },
      { id: 'B', position: { x: 0, y: 0 }, data: { label: 'B' }, type: 'default' },
    ];
    const edges: Edge[] = [{ id: 'e1', source: 'A', target: 'B' }];

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);

    expect(layoutedNodes.length).toBe(2);
    expect(layoutedEdges.length).toBe(1);
    layoutedNodes.forEach((node) => {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
    });
  });

  it('preserves node/edge count and sets directional props', () => {
    const nodes: Node[] = [
      { id: 'A', position: { x: 0, y: 0 }, data: { label: 'fileA.ts' }, type: 'default' },
    ];
    const edges: Edge[] = []; // no edges in this test

    const { nodes: resultNodes, edges: resultEdges } = getLayoutedElements(nodes, edges);

    expect(resultNodes).toHaveLength(1);
    expect(resultEdges).toHaveLength(0);
    expect(resultNodes[0]).toHaveProperty('sourcePosition');
    expect(resultNodes[0]).toHaveProperty('targetPosition');
  });
});