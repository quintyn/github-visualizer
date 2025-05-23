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

// Format a raw ISO date into a readable label like "Apr 2024"
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Placeholder data used when no repo is loaded
const staticNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'fileA.ts' }, type: 'default' },
  { id: '2', position: { x: 200, y: 100 }, data: { label: 'fileB.ts' }, type: 'default' },
];
const staticEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

/**
 * Use Dagre to compute layout coordinates for all nodes
 */
function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 100, nodesep: 80 });

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
}

function GraphInner({ repo }: TestGraphProps) {
  const [nodes, setNodes] = useState<Node[]>(staticNodes);
  const [edges, setEdges] = useState<Edge[]>(staticEdges);
  const [isGraphReady, setIsGraphReady] = useState(false);
  const [graphMode, setGraphMode] = useState<'code' | 'contributors'>('code');
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [loadDelayExceeded, setLoadDelayExceeded] = useState(false);
  const { fitView } = useReactFlow();

  const nodeTypes = { contributor: ContributorNode };

  /**
   * Handle node click:
   * - In 'code' mode, open file on GitHub
   * - In 'contributors' mode, open sidebar with details
   */
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (graphMode === 'contributors') {
      setSelectedNode(node);
    } else {
      const url = node.data?.url;
      if (url) window.open(url, '_blank');
    }
  }, [graphMode]);

  /**
   * Fetch graph data when the repo or graph mode changes
   * Adds a timeout warning if it takes longer than 10s
   */
  useEffect(() => {
    let cancelled = false;
    setLoadDelayExceeded(false);

    if (!repo) {
      setNodes(staticNodes);
      setEdges(staticEdges);
      setIsGraphReady(true);
      return;
    }

    setIsGraphReady(false);

    const timeout = setTimeout(() => {
      if (!isGraphReady) setLoadDelayExceeded(true);
    }, 10000);

    const endpoint = graphMode === 'code' ? '/api/fetch-files' : '/api/fetch-contributors';

    fetch(`${endpoint}?repo=${repo}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.nodes || !data.edges) return;

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
        if (!cancelled) {
          console.error('Error fetching graph data:', graphMode, err);
          setIsGraphReady(true);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [repo, graphMode]);

  // Center the view once layout is ready
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

  /**
   * Export the current graph data as a downloadable JSON file
   */
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

  /**
   * Apply subtle highlighting to search matches
   */
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
      {/* Show loading spinner and delay warning if needed */}
      {!isGraphReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/10 dark:bg-white/10 backdrop-blur-sm text-white px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white mb-3" />
          <p className="text-sm text-center">
            Loading {graphMode} graph data...<br />
            This may take a few seconds for larger repositories.
          </p>
          {loadDelayExceeded && (
            <p className="text-xs text-yellow-300 mt-2 text-center">
              This repo might be large or complex. If this persists, try switching modes or checking console logs.
            </p>
          )}
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

            {/* Contributor info sidebar */}
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
  );
}

export default function TestGraph(props: TestGraphProps) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  );
}