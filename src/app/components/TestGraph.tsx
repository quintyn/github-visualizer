// FULL UPDATED FILE

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { motion, AnimatePresence } from 'framer-motion';
import ContributorNode from '../components/ContributorNode';
import { getLayoutedElements } from '../utils/layout';

if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    if (e.key === 'Enter' && active?.id === 'repo-input') {
      active.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  });
}

type TestGraphProps = {
  repo: string;
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const staticNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'fileA.ts' }, type: 'default' },
  { id: '2', position: { x: 200, y: 100 }, data: { label: 'fileB.ts' }, type: 'default' },
];
const staticEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

function GraphInner({ repo }: TestGraphProps) {
  const [nodes, setNodes] = useState<Node[]>(staticNodes);
  const [edges, setEdges] = useState<Edge[]>(staticEdges);
  const [isGraphReady, setIsGraphReady] = useState(false);
  const [graphMode, setGraphMode] = useState<'code' | 'contributors'>('code');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { fitView } = useReactFlow();

  const nodeTypes = { contributor: ContributorNode };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (graphMode === 'contributors') {
      setSelectedNode(node);
    } else {
      const url = node.data?.url;
      if (url) window.open(url, '_blank');
    }
  }, [graphMode]);

  const fetchData = () => {
    setIsGraphReady(false);
    setErrorMessage('');

    const endpoint = graphMode === 'code' ? '/api/fetch-files' : '/api/fetch-contributors';

    fetch(`${endpoint}?repo=${repo}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.nodes || !data.edges) {
          setErrorMessage('No data returned. Check the repository name or try again.');
          setIsGraphReady(true);
          return;
        }

        const rawNodes: Node[] = data.nodes.map((node: any) => {
          const fileName = node.id.split('/').pop() || node.id;
          return {
            id: node.id,
            type: graphMode === 'contributors' ? 'contributor' : 'default',
            data: {
              label: graphMode === 'code' ? fileName : node.label,
              avatarUrl: node.avatarUrl,
              prCount: node.prCount,
              reviewCount: node.reviewCount,
              lastActivity: node.lastActivity,
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
        console.error('Error fetching graph data:', graphMode, err);
        setErrorMessage('Failed to fetch graph data. Check your network or try again.');
        setIsGraphReady(true);
      });
  };

  useEffect(() => {
    if (!repo) {
      setNodes(staticNodes);
      setEdges(staticEdges);
      setIsGraphReady(true);
      return;
    }
    fetchData();
  }, [repo, graphMode]);

  useEffect(() => {
    if (!isGraphReady || errorMessage) return;
    requestAnimationFrame(() => {
      try {
        fitView({ padding: 0.2 });
      } catch (err) {
        console.warn('fitView error:', err);
      }
    });
  }, [isGraphReady, fitView, errorMessage]);

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

  const extensionColorMap: Record<string, string> = {
    ts: '#3b82f6',
    js: '#facc15',
    css: '#10b981',
    json: '#ec4899',
    html: '#f97316',
    md: '#8b5cf6',
  };

  function getNodeColorByExtension(id: string): string {
    const ext = id.split('.').pop() || '';
    return extensionColorMap[ext] || '#64748b';
  }

  const filteredNodes = nodes.map((node) => {
    const isMatch = node.data.label.toLowerCase().includes(searchTerm.toLowerCase());
    return {
      ...node,
      style: {
        background: getNodeColorByExtension(node.id),
        color: 'white',
        opacity: searchTerm ? (isMatch ? 1 : 0.3) : 1,
        border: isMatch ? '2px solid #3b82f6' : '1px solid #888',
      },
    };
  });

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-[9999]' : 'w-full h-full'} bg-white dark:bg-zinc-800`}>
      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow z-50">
          <p>{errorMessage}</p>
          <button onClick={fetchData} className="mt-2 underline text-sm">
            Retry
          </button>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="flex flex-wrap justify-between items-center gap-4 px-4 py-2 border-b border-zinc-700 dark:bg-zinc-800">
        <div className="text-sm text-zinc-500 truncate">
          {repo ? (
            <>Loaded repo: <code>{repo}</code> — <span className="capitalize">{graphMode} graph</span></>
          ) : (
            'Showing sample dependency graph.'
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 w-full">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-1 border rounded bg-zinc-900 text-white border-zinc-700"
          />

          <div className="flex border rounded overflow-hidden">
            <button onClick={() => setGraphMode('code')} className={`px-2 py-1 ${graphMode === 'code' ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}>
              Code
            </button>
            <button onClick={() => setGraphMode('contributors')} className={`px-2 py-1 ${graphMode === 'contributors' ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}>
              Contributors
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => fitView({ padding: 0.2 })} className="border px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700">
              Reset View
            </button>
            <button onClick={() => setIsFullscreen((prev) => !prev)} className="border px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700">
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            <button onClick={exportToJSON} className="border px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700">
              Export JSON
            </button>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={showMiniMap} onChange={() => setShowMiniMap((prev) => !prev)} />
              MiniMap
            </label>
          </div>
        </div>
      </div>

      {/* GRAPH + SIDEPANEL */}
      <div className="w-full h-[calc(100%-48px)] relative">
        {!isGraphReady && (
  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm px-4 text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white mb-4" />
    <p className="text-sm text-zinc-100 max-w-xs">
      Fetching and analyzing source files… This may take up to 20 seconds on large repositories.
    </p>
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
                onNodeMouseEnter={(_, node) => {
                  if (graphMode === 'code') setHoveredNodeId(node.id);
                }}
                onNodeMouseLeave={() => {
                  if (graphMode === 'code') setHoveredNodeId(null);
                }}
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

              {/* TOOLTIP FOR HOVERED NODE */}
              {hoveredNodeId && graphMode === 'code' && (
                <div className="absolute pointer-events-none text-xs text-white bg-zinc-700 px-2 py-1 rounded shadow top-2 left-2 z-50 animate-fadeIn">
                  {hoveredNodeId}
                </div>
              )}

              {/* CONTRIBUTOR SIDE PANEL */}
              {graphMode === 'contributors' && selectedNode && (
                <div className="absolute top-0 right-0 w-64 h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-700 p-4 shadow-lg z-50">
                  <h2 className="text-lg font-semibold mb-3 text-zinc-800 dark:text-white">
                    {selectedNode.data.label}
                  </h2>
                  <img
                    src={selectedNode.data.avatarUrl}
                    alt={selectedNode.data.label}
                    className="w-16 h-16 rounded-full border mb-4"
                  />
                  <ul className="text-sm space-y-1 text-zinc-700 dark:text-zinc-300">
                    <li>PRs authored: {selectedNode.data.prCount ?? 'N/A'}</li>
                    <li>Reviews given: {selectedNode.data.reviewCount ?? 'N/A'}</li>
                    <li>Last activity: {formatDate(selectedNode.data.lastActivity)}</li>
                  </ul>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Close
                  </button>
                </div>
              )}
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