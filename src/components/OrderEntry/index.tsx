/**
 * OrderEntry Component - Order input form (mock submit)
 * 订单输入组件 - 订单输入表单（模拟提交）
 */

'use client';

import { useState } from 'react';
import { useMarketStore } from '@/stores/marketStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function OrderEntry() {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const currentMarket = useMarketStore((state) => state.currentMarket);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Mock order:', { side, price, quantity, market: currentMarket.symbol });
    alert(`Mock ${side.toUpperCase()}: ${quantity} @ ${price}`);
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-gray-300 mb-4">
        Place Order / 下单
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setSide('buy')}
            variant={side === 'buy' ? 'default' : 'outline'}
            className={side === 'buy' ? 'flex-1 bg-green-600 hover:bg-green-700' : 'flex-1'}
          >
            Buy / 买入
          </Button>
          <Button
            type="button"
            onClick={() => setSide('sell')}
            variant={side === 'sell' ? 'default' : 'outline'}
            className={side === 'sell' ? 'flex-1 bg-red-600 hover:bg-red-700' : 'flex-1'}
          >
            Sell / 卖出
          </Button>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Price / 价格</label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Amount / 数量</label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <Button
          type="submit"
          className={`w-full ${
            side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {side === 'buy' ? 'Buy' : 'Sell'} {currentMarket.baseAsset}
        </Button>
      </form>
    </div>
  );
}
