'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import * as Tooltip from '@radix-ui/react-tooltip';

const ContributorNode = memo(({ data }: NodeProps) => {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
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
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            className="z-50 rounded-md px-3 py-2 text-xs bg-zinc-800 text-white shadow-lg animate-fade-in-out"
          >
            <div className="font-medium text-sm">{data.label}</div>
            <div className="text-zinc-300 text-xs mt-1 leading-tight">
              PRs: {data.prCount ?? 0}<br />
              Reviews: {data.reviewCount ?? 0}<br />
              Last Active: {data.lastActivity ?? 'N/A'}
            </div>
            <Tooltip.Arrow className="fill-zinc-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
});

export default ContributorNode;