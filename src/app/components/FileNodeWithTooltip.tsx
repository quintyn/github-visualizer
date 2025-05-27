'use client';

import { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@radix-ui/react-tooltip';

const FileNodeWithTooltip = memo(({ data }: NodeProps) => {
  const tooltipText = data?.path || data?.label || 'Unknown file';
  const fileName = data?.label || 'file.ts';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="px-3 py-1.5 rounded-xl shadow-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors duration-200 cursor-default">
            <span>{fileName}</span>
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="px-3 py-2 rounded-md bg-zinc-900 text-white text-xs shadow-lg animate-fade-in"
        >
          <div className="flex flex-col gap-1 max-w-xs">
            <span className="font-semibold text-blue-400">{tooltipText}</span>
            <span className="opacity-80">Click to view on GitHub</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default FileNodeWithTooltip;