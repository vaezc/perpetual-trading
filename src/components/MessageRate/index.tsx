/**
 * MessageRate Component - Display message rate
 * 消息速率组件 - 显示消息接收速率
 */

'use client';

import { useMarketStore } from '@/stores/marketStore';

export default function MessageRate() {
  const messageRate = useMarketStore((state) => state.stats.messageRate);

  return (
    <div className="px-4 py-2 bg-gray-900 rounded-lg">
      <div className="text-sm text-gray-400">Message Rate / 消息速率</div>
      <div className="text-lg font-mono text-green-500">
        {messageRate.toFixed(1)} msgs/s
      </div>
    </div>
  );
}
