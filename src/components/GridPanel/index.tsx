/**
 * GridPanel - Wrapper component for grid items
 * 网格面板 - 网格项的包装组件
 */

import { ReactNode } from "react";

interface GridPanelProps {
  children: ReactNode;
}

export default function GridPanel({ children }: GridPanelProps) {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden h-full w-full flex flex-col">
      {children}
    </div>
  );
}
