/**
 * MarketSelector Component - Market selection dropdown
 * 市场选择器组件 - 市场选择下拉框
 */

'use client';

import { useMarketStore } from '@/stores/marketStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MARKETS = [
  { symbol: 'BTCUSDT', name: 'BTC/USDT' },
  { symbol: 'ETHUSDT', name: 'ETH/USDT' },
  { symbol: 'BNBUSDT', name: 'BNB/USDT' },
];

export default function MarketSelector() {
  const currentMarket = useMarketStore((state) => state.currentMarket);
  const setMarket = useMarketStore((state) => state.setMarket);

  return (
    <Select
      value={currentMarket.symbol}
      onValueChange={(value) => {
        const market = MARKETS.find((m) => m.symbol === value);
        if (market) {
          setMarket({
            symbol: market.symbol,
            baseAsset: market.symbol.replace('USDT', ''),
            quoteAsset: 'USDT',
            pricePrecision: 2,
            quantityPrecision: 6,
          });
        }
      }}
    >
      <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
        <SelectValue placeholder="选择市场" />
      </SelectTrigger>
      <SelectContent className="bg-gray-800 border-gray-700">
        {MARKETS.map((market) => (
          <SelectItem
            key={market.symbol}
            value={market.symbol}
            className="text-white hover:bg-gray-700 focus:bg-gray-700"
          >
            {market.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
