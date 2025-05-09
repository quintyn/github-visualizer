'use client';

import React, { useState } from 'react';
import ReactFlow, { MiniMap, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

type TestGraphProps = {
  repo: string;
};

// Sample data just to show something if no repo is loaded yet
const staticNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'fileA.ts' }, type: 'default' },
  { id: '2', position: { x: 200, y: 100 }, data: { label: 'fileB.ts' }, type: 'default' },
];

const staticEdges = [{ id: 'e1-2', source: '1', target: '2' }];

export default function TestGraph({ repo }: TestGraphProps) {
  const [showMiniMap, setShowMiniMap] = useState(true);

  // If there's no repo input yet, stick with the sample data
  const showStatic = !repo;
  const nodes = showStatic ? staticNodes : [];
  const edges = showStatic ? staticEdges : [];

  return (
    <div className="w-full h-[500px] rounded-lg bg-white dark:bg-zinc-800 shadow-sm border border-zinc-700">
      <div className="flex justify-between items-center px-2 pt-2">
        <p className="text-sm text-zinc-500">
          {showStatic
            ? 'Showing sample dependency graph.'
            : <>Loaded repo: <code>{repo}</code></>}
        </p>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input
            type="checkbox"
            checked={showMiniMap}
            onChange={() => setShowMiniMap(prev => !prev)}
          />
          Show minimap
        </label>
      </div>

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
  );
}