/**
 * OrderEntry Component - Order input form (mock submit)
 * 订单输入组件 - 订单输入表单（模拟提交）
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMarketStore } from "@/stores/marketStore";

const PCT_SHORTCUTS = [25, 50, 75, 100] as const;

interface Errors {
  price?: string;
  quantity?: string;
}

function validate(price: string, quantity: string): Errors {
  const errors: Errors = {};
  if (!price || isNaN(Number(price)) || Number(price) <= 0) {
    errors.price = "请输入有效价格";
  }
  if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
    errors.quantity = "请输入有效数量";
  }
  return errors;
}

interface OrderFormProps {
  side: "buy" | "sell";
}

function OrderForm({ side }: OrderFormProps) {
  const currentMarket = useMarketStore((state) => state.currentMarket);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const isBuy = side === "buy";
  const label = isBuy ? "买入" : "卖出";
  const accentClass = isBuy
    ? "bg-green-600 hover:bg-green-500 active:bg-green-700"
    : "bg-red-600 hover:bg-red-500 active:bg-red-700";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(price, quantity);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    toast.success(isBuy ? "买入委托成功" : "卖出委托成功", {
      description: `${quantity} ${currentMarket.baseAsset} @ ${price} ${currentMarket.quoteAsset}`,
      duration: 3000,
    });
    setPrice("");
    setQuantity("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-3 h-full" noValidate>
      <h3 className={`text-sm font-semibold ${isBuy ? "text-green-400" : "text-red-400"}`}>
        {label} {currentMarket.baseAsset}
      </h3>

      {/* Price */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">
          价格({currentMarket.quoteAsset})
        </Label>
        <div className="relative">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              if (errors.price) setErrors((prev) => ({ ...prev, price: undefined }));
            }}
            placeholder="0.00"
            className={`h-8 bg-gray-800 text-white text-xs pr-12 focus-visible:ring-gray-500 ${
              errors.price ? "border-red-500" : "border-gray-600"
            }`}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
            {currentMarket.quoteAsset}
          </span>
        </div>
        {errors.price && (
          <p className="text-xs text-red-400">{errors.price}</p>
        )}
      </div>

      {/* Quantity */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">
          数量({currentMarket.baseAsset})
        </Label>
        <div className="relative">
          <Input
            type="number"
            min="0"
            step="0.000001"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: undefined }));
            }}
            placeholder="0.000000"
            className={`h-8 bg-gray-800 text-white text-xs pr-10 focus-visible:ring-gray-500 ${
              errors.quantity ? "border-red-500" : "border-gray-600"
            }`}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
            {currentMarket.baseAsset}
          </span>
        </div>
        {errors.quantity && (
          <p className="text-xs text-red-400">{errors.quantity}</p>
        )}
      </div>

      {/* Percentage shortcuts */}
      <div className="grid grid-cols-4 gap-1">
        {PCT_SHORTCUTS.map((pct) => (
          <button
            key={pct}
            type="button"
            className="text-xs text-gray-400 bg-gray-800 hover:bg-gray-700 hover:text-gray-200 rounded py-1 transition-colors"
            onClick={() => {
              setQuantity(String(pct));
              if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: undefined }));
            }}
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* Available */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>可用</span>
        <span className="text-gray-400">
          -- {isBuy ? currentMarket.quoteAsset : currentMarket.baseAsset}
        </span>
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
