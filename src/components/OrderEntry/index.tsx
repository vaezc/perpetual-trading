/**
 * OrderEntry Component - Order input form (mock submit)
 * 订单输入组件 - 订单输入表单（模拟提交）
 */

"use client";

import { useState } from "react";
import { useMarketStore } from "@/stores/marketStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OrderEntry() {
  const [buyPrice, setBuyPrice] = useState("");
  const [buyQuantity, setBuyQuantity] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellQuantity, setSellQuantity] = useState("");
  const currentMarket = useMarketStore((state) => state.currentMarket);

  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Mock buy order:", { price: buyPrice, quantity: buyQuantity });
    alert(`Mock BUY: ${buyQuantity} @ ${buyPrice}`);
  };

  const handleSell = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Mock sell order:", {
      price: sellPrice,
      quantity: sellQuantity,
    });
    alert(`Mock SELL: ${sellQuantity} @ ${sellPrice}`);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      <div className="grid grid-cols-2 h-full divide-x divide-gray-700">
        {/* Buy Form / 买入表单 */}
        <form onSubmit={handleBuy} className="flex flex-col p-4 space-y-4">
          <h3 className="text-base font-semibold text-white">买入</h3>

          <div className="space-y-2">
            <Label htmlFor="buy-price" className="text-xs text-gray-400">
              价格
            </Label>
            <div className="relative">
              <Input
                id="buy-price"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.00"
                className="bg-gray-800 border-gray-700 text-white text-sm h-9"
                required
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                USDT
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buy-quantity" className="text-xs text-gray-400">
              数量
            </Label>
            <div className="relative">
              <Input
                id="buy-quantity"
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(e.target.value)}
                placeholder="0.00"
                className="bg-gray-800 border-gray-700 text-white text-sm h-9"
                required
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                BTC
              </span>
            </div>
          </div>

          <div className="flex-1" />

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 h-10"
          >
            买入BTC
          </Button>
        </form>

        {/* Sell Form / 卖出表单 */}
        <form onSubmit={handleSell} className="flex flex-col p-4 space-y-4">
          <h3 className="text-base font-semibold text-white">卖出</h3>

          <div className="space-y-2">
            <Label htmlFor="sell-price" className="text-xs text-gray-400">
              价格
            </Label>
            <div className="relative">
              <Input
                id="sell-price"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0.00"
                className="bg-gray-800 border-gray-700 text-white text-sm h-9"
                required
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                USDT
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sell-quantity" className="text-xs text-gray-400">
              数量
            </Label>
            <div className="relative">
              <Input
                id="sell-quantity"
                value={sellQuantity}
                onChange={(e) => setSellQuantity(e.target.value)}
                placeholder="0.00"
                className="bg-gray-800 border-gray-700 text-white text-sm h-9"
                required
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                BTC
              </span>
            </div>
          </div>

          <div className="flex-1" />

          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 h-10"
          >
            卖出BTC
          </Button>
        </form>
      </div>
    </div>
  );
}
