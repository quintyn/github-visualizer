'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const ContributorNode = memo(({ data }: NodeProps) => {
  return (
    <div className="flex items-center gap-2 p-2 rounded-xl shadow-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
      <img
        src={data.avatarUrl}
        alt={data.label}
        className="w-8 h-8 rounded-full border border-gray-400"
      />
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {data.label}
      </span>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

export default ContributorNode;