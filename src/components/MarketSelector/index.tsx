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

  const handleChange = (value: string) => {
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
  };

  return (
    <Select value={currentMarket.symbol} onValueChange={handleChange}>
      <SelectTrigger
        aria-label="选择市场"
        className="h-7 w-32 bg-gray-800 border-gray-700 text-xs text-white px-2 focus:ring-0 focus:ring-offset-0"
      >
        <SelectValue placeholder="选择市场" />
      </SelectTrigger>
      <SelectContent className="bg-gray-800 border-gray-700 text-xs">
        {MARKETS.map((market) => (
          <SelectItem
            key={market.symbol}
            value={market.symbol}
            className="text-xs text-white focus:bg-gray-700 focus:text-white"
          >
            {market.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
