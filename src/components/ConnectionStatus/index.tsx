/**
 * ConnectionStatus Component - WebSocket connection indicator
 * 连接状态组件 - WebSocket 连接状态指示器
 */

'use client';

import { useMarketStore } from '@/stores/marketStore';

const STATUS_CONFIG = {
  connected:     { dot: 'bg-green-500',              text: '已连接' },
  connecting:    { dot: 'bg-yellow-400 animate-pulse', text: '连接中' },
  reconnecting:  { dot: 'bg-yellow-400 animate-pulse', text: '重连中' },
  disconnected:  { dot: 'bg-gray-500',               text: '已断开' },
  disconnecting: { dot: 'bg-gray-500',               text: '断开中' },
  error:         { dot: 'bg-red-500',                text: '错误' },
} as const;

export default function ConnectionStatus() {
  const status = useMarketStore((state) => state.connectionStatus);
  const { dot, text } = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span className="text-xs text-gray-400">{text}</span>
    </div>
  );
}
