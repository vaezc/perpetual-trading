/**
 * OrderEntry Component - Order input form (mock submit)
 * 订单输入组件 - 订单输入表单（模拟提交）
 */

"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PCT_SHORTCUTS = [25, 50, 75, 100] as const;

interface OrderFormProps {
  side: "buy" | "sell";
}

function OrderForm({ side }: OrderFormProps) {
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const isBuy = side === "buy";
  const label = isBuy ? "买入" : "卖出";
  const accentClass = isBuy
    ? "bg-green-600 hover:bg-green-500 active:bg-green-700"
    : "bg-red-600 hover:bg-red-500 active:bg-red-700";

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      alert(`Mock ${side.toUpperCase()}: ${quantity} @ ${price}`);
    },
    [side, price, quantity],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-3 h-full">
      <h3
        className={`text-sm font-semibold ${isBuy ? "text-green-400" : "text-red-400"}`}
      >
        {label} BTC
      </h3>

      {/* Price */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">价格</Label>
        <div className="relative">
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="h-8 bg-gray-800 border-gray-600 text-white text-xs pr-12 focus-visible:ring-gray-500"
            required
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
            USDT
          </span>
        </div>
      </div>

      {/* Quantity */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">数量</Label>
        <div className="relative">
          <Input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
            className="h-8 bg-gray-800 border-gray-600 text-white text-xs pr-10 focus-visible:ring-gray-500"
            required
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
            BTC
          </span>
        </div>
      </div>

      {/* Percentage shortcuts */}
      <div className="grid grid-cols-4 gap-1">
        {PCT_SHORTCUTS.map((pct) => (
          <button
            key={pct}
            type="button"
            className="text-xs text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-gray-200 rounded py-1 transition-colors"
            onClick={() => setQuantity(String(pct))}
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* Available */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>可用</span>
        <span className="text-gray-400">-- {isBuy ? "USDT" : "BTC"}</span>
      </div>

      <div className="flex-1" />

      <Button
        type="submit"
        className={`w-full h-9 text-sm font-semibold text-white transition-colors ${accentClass}`}
      >
        {label}
      </Button>
    </form>
  );
}

export default function OrderEntry() {
  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      <div className="grid grid-cols-2 h-full divide-x divide-gray-700">
        <OrderForm side="buy" />
        <OrderForm side="sell" />
      </div>
    </div>
  );
}
