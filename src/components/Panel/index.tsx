'use client';

import { ReactNode } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export interface PanelProps {
  id: string;
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  skeleton?: ReactNode;
  /** Extra Tailwind classes applied to the root element */
  className?: string;
  isMaximized?: boolean;
  onMaximize?: (id: string) => void;
  onRestore?: () => void;
  onDragStart?: (id: string, e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

export default function Panel({
  id,
  title,
  children,
  isLoading,
  skeleton,
  className = '',
  isMaximized,
  onMaximize,
  onRestore,
  onDragStart,
  onDragEnd,
}: PanelProps) {
  return (
    <div className={`flex flex-col bg-gray-900 overflow-hidden ${className}`}>
      {/* Panel header — draggable */}
      <div
        className="flex items-center justify-between h-8 px-3 shrink-0 bg-[#0e1117] border-b border-gray-800 cursor-grab active:cursor-grabbing select-none"
        draggable
        onDragStart={(e) => onDragStart?.(id, e)}
        onDragEnd={onDragEnd}
      >
        <span className="text-[11px] font-medium text-gray-500 tracking-wider uppercase">
          {title}
        </span>

        <button
          onClick={isMaximized ? onRestore : () => onMaximize?.(id)}
          className="p-1 rounded hover:bg-gray-800 text-gray-600 hover:text-gray-300 transition-colors"
          title={isMaximized ? '还原 (Esc)' : '最大化'}
        >
          {isMaximized
            ? <Minimize2 className="w-3.5 h-3.5" />
            : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoading && skeleton ? skeleton : children}
      </div>
    </div>
  );
}
