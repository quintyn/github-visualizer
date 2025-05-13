'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Node,
  Edge,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { motion, AnimatePresence } from 'framer-motion';
import ContributorNode from '../components/ContributorNode';

type TestGraphProps = {
  repo: string;
};

const staticNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'fileA.ts' }, type: 'default' },
  { id: '2', position: { x: 200, y: 100 }, data: { label: 'fileB.ts' }, type: 'default' },
];
const staticEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

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

function GraphInner({ repo }: TestGraphProps) {
  const [nodes, setNodes] = useState<Node[]>(staticNodes);
  const [edges, setEdges] = useState<Edge[]>(staticEdges);
  const [isGraphReady, setIsGraphReady] = useState(false);
  const [graphMode, setGraphMode] = useState<'code' | 'contributors'>('code');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { fitView } = useReactFlow();

  const nodeTypes = {
    contributor: ContributorNode,
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const url = node.data?.url;
    if (url) window.open(url, '_blank');
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!repo) {
      setNodes(staticNodes);
      setEdges(staticEdges);
      setIsGraphReady(true);
      return;
    }

    setIsGraphReady(false);

    const endpoint = graphMode === 'code' ? '/api/fetch-files' : '/api/fetch-contributors';

    fetch(`${endpoint}?repo=${repo}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.nodes || !data.edges) return;

        const rawNodes: Node[] = data.nodes.map((node: { id: string; avatarUrl?: string }) => {
          const fileName = node.id.split('/').pop() || node.id;
          return {
            id: node.id,
            type: graphMode === 'contributors' ? 'contributor' : 'default',
            data: {
              label: graphMode === 'code' ? fileName : node.id,
              avatarUrl: node.avatarUrl,
              url: graphMode === 'code'
                ? `https://github.com/${repo}/blob/main/${node.id}`
                : undefined,
            },
            position: { x: 0, y: 0 },
          };
        });

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
        setIsGraphReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Error fetching graph data:', graphMode, err);
          setIsGraphReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repo, graphMode]);

  useEffect(() => {
    if (!isGraphReady) return;
    requestAnimationFrame(() => {
      try {
        fitView({ padding: 0.2 });
      } catch (err) {
        console.warn('fitView error:', err);
      }
    });
  }, [isGraphReady, fitView]);

  const exportToJSON = () => {
    const dataStr = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${repo || 'graph'}-${graphMode}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredNodes = searchTerm
    ? nodes.map((node) => ({
        ...node,
        style: {
          opacity: node.data.label.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0.25,
          border: node.data.label.toLowerCase().includes(searchTerm.toLowerCase())
            ? '2px solid #3b82f6'
            : '1px solid #888',
        },
      }))
    : nodes;

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[9999]' : 'w-full h-full'} bg-white dark:bg-zinc-800`}>
      {/* Top controls */}
      <div className="flex flex-wrap justify-between items-center gap-4 px-4 py-2 border-b border-zinc-700 dark:bg-zinc-800">
        <div className="text-sm text-zinc-500 truncate">
          {repo ? (
            <>
              Loaded repo: <code>{repo}</code> —{' '}
              <span className="capitalize">{graphMode} graph</span>
            </>
          ) : (
            'Showing sample dependency graph.'
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1 border rounded bg-zinc-900 text-white border-zinc-700"
          />

          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setGraphMode('code')}
              className={`px-2 py-1 ${graphMode === 'code' ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
            >
              Code
            </button>
            <button
              onClick={() => setGraphMode('contributors')}
              className={`px-2 py-1 ${graphMode === 'contributors' ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
            >
              Contributors
            </button>
          </div>

          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showMiniMap}
              onChange={() => setShowMiniMap((prev) => !prev)}
            />
            MiniMap
          </label>

          <button onClick={() => fitView({ padding: 0.2 })} className="border px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700">
            Reset View
          </button>

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

      {/* Graph canvas and loading overlay */}
      <div className="w-full h-[calc(100%-48px)] relative">
        {!isGraphReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 dark:bg-white/10 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-zinc-300 dark:border-white"></div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isGraphReady && (
            <motion.div
              key={graphMode + repo}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ReactFlow
                nodes={filteredNodes}
                edges={edges}
                onNodeClick={onNodeClick}
                fitView
                nodeTypes={nodeTypes}
              >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TestGraph(props: TestGraphProps) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
}