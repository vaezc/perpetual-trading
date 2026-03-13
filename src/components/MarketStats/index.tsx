'use client';

import { useMarketStore } from '@/stores/marketStore';
import { useMarketStats } from '@/hooks/useMarketStats';

export default function MarketStats() {
  const symbol = useMarketStore((s) => s.currentMarket.symbol);
  const baseAsset = useMarketStore((s) => s.currentMarket.baseAsset);
  const { lastPrice, priceChangePercent, highPrice, lowPrice, volume, fundingRate, countdown } =
    useMarketStats(symbol);

  const pct = parseFloat(priceChangePercent);
  const isUp = pct >= 0;
  const upDownColor = isUp ? 'text-[#0ecb81]' : 'text-[#ef5350]';

  const fundingNum = parseFloat(fundingRate);
  const fundingColor = isNaN(fundingNum) || fundingNum >= 0 ? 'text-[#0ecb81]' : 'text-[#ef5350]';

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 border-b border-gray-800 bg-black text-xs overflow-x-auto shrink-0">
      {/* 最新价 */}
      <div className="flex items-baseline gap-1.5 shrink-0">
        <span className={`text-sm font-semibold ${upDownColor}`}>{lastPrice}</span>
        <span className={upDownColor}>
          {isUp ? '+' : ''}{priceChangePercent !== '--' ? `${pct.toFixed(2)}%` : '--'}
        </span>
      </div>

      <div className="w-px h-3 bg-gray-700 shrink-0" />

      {/* 24h 高低 */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-gray-500">24h高</span>
        <span className="text-gray-200">{highPrice}</span>
        <span className="text-gray-500">24h低</span>
        <span className="text-gray-200">{lowPrice}</span>
      </div>

      <div className="w-px h-3 bg-gray-700 shrink-0" />

      {/* 24h 成交量 */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-gray-500">24h量</span>
        <span className="text-gray-200">{volume} {baseAsset}</span>
      </div>

      <div className="w-px h-3 bg-gray-700 shrink-0" />

      {/* 资金费率 + 倒计时 */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-gray-500">资金费率</span>
        <span className={fundingColor}>
          {fundingRate !== '--' ? `${fundingRate}%` : '--'}
        </span>
        <span className="text-gray-500 ml-1">下次结算</span>
        <span className="text-gray-300 font-mono">{countdown}</span>
      </div>
    </div>
  );
}
