/**
 * OrderBook Row Components
 * 订单簿行组件
 */

import { CSSProperties } from "react";
import { PriceLevel } from "@/types/orderBook";
import { formatPrice, formatQuantity } from "@/lib/utils";

type LevelWithTotal = PriceLevel & { total?: string };

// Only the extra props passed via rowProps — index/style are injected by the library
export interface RowListProps {
  levels: LevelWithTotal[];
  pricePrecision: number;
  quantityPrecision: number;
}

// Library injects these at runtime but they're not part of RowProps inference
type Injected = { index: number; style: CSSProperties };

export function BidRow(props: RowListProps) {
  const { index, style, levels, pricePrecision, quantityPrecision } =
    props as RowListProps & Injected;
  const level = levels[index];
  return (
    <div style={style} className="flex justify-between px-3 text-xs hover:bg-gray-800">
      <span className="text-green-400">{formatPrice(level.price, pricePrecision)}</span>
      <span className="text-gray-300">{formatQuantity(level.quantity, quantityPrecision)}</span>
      <span className="text-gray-500">{level.total ? formatQuantity(level.total, quantityPrecision) : "-"}</span>
    </div>
  );
}

export function AskRow(props: RowListProps) {
  const { index, style, levels, pricePrecision, quantityPrecision } =
    props as RowListProps & Injected;
  const level = levels[index];
  return (
    <div style={style} className="flex justify-between px-3 text-xs hover:bg-gray-800">
      <span className="text-red-400">{formatPrice(level.price, pricePrecision)}</span>
      <span className="text-gray-300">{formatQuantity(level.quantity, quantityPrecision)}</span>
      <span className="text-gray-500">{level.total ? formatQuantity(level.total, quantityPrecision) : "-"}</span>
    </div>
  );
}
