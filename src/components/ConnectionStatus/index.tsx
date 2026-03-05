/**
 * ConnectionStatus Component - WebSocket connection indicator
 * 连接状态组件 - WebSocket 连接状态指示器
 */

'use client';

import { useMarketStore } from '@/stores/marketStore';

export default function ConnectionStatus() {
  const status = useMarketStore((state) => state.connectionStatus);

  const statusConfig = {
    connected: { color: 'bg-green-500', text: 'Connected / 已连接' },
    connecting: { color: 'bg-yellow-500', text: 'Connecting / 连接中' },
    reconnecting: { color: 'bg-yellow-500', text: 'Reconnecting / 重连中' },
    disconnected: { color: 'bg-gray-500', text: 'Disconnected / 已断开' },
    disconnecting: { color: 'bg-gray-500', text: 'Disconnecting / 断开中' },
    error: { color: 'bg-red-500', text: 'Error / 错误' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg">
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-sm text-gray-300">{config.text}</span>
    </div>
  );
}
