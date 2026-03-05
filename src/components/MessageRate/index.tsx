/**
 * MessageRate Component - Display message rate
 * 消息速率组件 - 显示消息接收速率
 */

'use client';

import { useMarketStore } from '@/stores/marketStore';

export default function MessageRate() {
  const messageRate = useMarketStore((state) => state.stats.messageRate);

  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <span className="font-mono text-gray-300 tabular-nums">
        {messageRate}
      </span>
      <span>msg/s</span>
    </div>
  );
}
