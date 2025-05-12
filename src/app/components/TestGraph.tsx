'use client';

import React, { useState, useEffect } from 'react';
import ReactFlow, { MiniMap, Controls, Node, Edge, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

type TestGraphProps = {
  repo: string;
};

// Sample fallback graph when no repo is loaded
const staticNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'fileA.ts' }, type: 'default' },
  { id: '2', position: { x: 200, y: 100 }, data: { label: 'fileB.ts' }, type: 'default' },
];
const staticEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

/**
 * Arrange nodes in a left-to-right flow using dagre
 */
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'LR',
    ranksep: 100,
    nodesep: 80,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 40 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => {
      const { x, y } = dagreGraph.node(node.id);
      return {
        ...node,
        position: { x, y },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    }),
    edges,
  };
};

export default function TestGraph({ repo }: TestGraphProps) {
  const [nodes, setNodes] = useState<Node[]>(staticNodes);
  const [edges, setEdges] = useState<Edge[]>(staticEdges);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!repo) {
      setNodes(staticNodes);
      setEdges(staticEdges);
      return;
    }

    fetch(`/api/fetch-files?repo=${repo}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.nodes || !data.edges) return;

        const rawNodes: Node[] = data.nodes.map((node: { id: string }) => ({
          id: node.id,
          data: { label: node.id.split('/').pop() || node.id }, // Just the filename
          position: { x: 0, y: 0 }, // Dagre will calculate layout
          type: 'default',
        }));

        const rawEdges: Edge[] = data.edges.map(
          (edge: { source: string; target: string }, index: number) => ({
            id: `e-${index}`,
            source: edge.source,
            target: edge.target,
          })
        );

        const layouted = getLayoutedElements(rawNodes, rawEdges);
        setNodes(layouted.nodes);
        setEdges(layouted.edges);
      })
      .catch((err) => console.error('Error fetching graph data:', err));
  }, [repo]);

  const exportToJSON = () => {
    const dataStr = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${repo || 'graph'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[9999]' : 'w-full h-full'} bg-white dark:bg-zinc-800`}>
      {/* Top bar with info and controls */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-700 dark:bg-zinc-800">
        <p className="text-sm text-zinc-500 truncate">
          {!repo ? 'Showing sample dependency graph.' : <>Loaded repo: <code>{repo}</code></>}
        </p>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showMiniMap}
              onChange={() => setShowMiniMap((prev) => !prev)}
            />
            Show minimap
          </label>
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="border px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button
            onClick={exportToJSON}
            className="border px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Graph canvas */}
      <div className="w-full h-[calc(100%-48px)]">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          {showMiniMap && (
            <MiniMap
              style={{ height: 90, width: 140, borderRadius: 6, opacity: 0.85 }}
              zoomable
              pannable
              nodeStrokeColor={() => '#888'}
              nodeColor={() => '#333'}
            />
          )}
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}