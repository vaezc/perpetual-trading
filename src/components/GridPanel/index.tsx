/**
 * GridPanel - Wrapper component for grid items
 * 网格面板 - 网格项的包装组件
 */

import { ReactNode } from "react";

interface GridPanelProps {
  children: ReactNode;
  isLoading?: boolean;
  skeleton?: ReactNode;
}

export default function GridPanel({ children, isLoading, skeleton }: GridPanelProps) {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden h-full w-full flex flex-col">
      <div className="drag-handle h-2 shrink-0 cursor-grab active:cursor-grabbing bg-gray-800 hover:bg-gray-600 transition-colors" />
      <div
        className="no-drag flex-1 min-h-0 overflow-hidden flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {isLoading && skeleton ? skeleton : children}
      </div>
    </div>
  );
}
