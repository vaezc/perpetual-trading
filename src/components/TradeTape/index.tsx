/**
 * TradeTape Component - Virtualized trade history display
 * 交易流水组件 - 虚拟化交易历史显示
 */

"use client";

import { memo } from "react";
import { List, type RowComponentProps } from "react-window";
import { useTradeStore } from "@/stores/tradeStore";
import { Trade } from "@/types/trade";
import { formatPrice, formatQuantity, formatTime } from "@/lib/utils";

interface TradeTapeProps {
  pricePrecision?: number;
  quantityPrecision?: number;
}

export default function TradeTape({
  pricePrecision = 2,
  quantityPrecision = 6,
}: TradeTapeProps) {
  const trades = useTradeStore((state) => state.trades);

  const TradeRowComponent = ({
    index,
    style,
  }: RowComponentProps<Record<string, never>>) => (
    <TradeRow
      trade={trades[index]}
      style={style}
      pricePrecision={pricePrecision}
      quantityPrecision={quantityPrecision}
    />
  );

  return (
    <div className="flex flex-col h-full border rounded-lg bg-gray-900 border-gray-700">
      {/* Header / 表头 */}
      <div className="flex justify-between px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
        <span>时间</span>
        <span>价格(USDT)</span>
        <span>数量(BTC)</span>
      </div>

      {/* Trade List / 交易列表 */}
      <div className="flex-1 overflow-hidden">
        <List
          className="custom-scrollbar"
          rowCount={trades.length}
          rowHeight={20}
          rowComponent={TradeRowComponent}
          rowProps={{}}
        />
      </div>
    </div>
  );
}

/**
 * Trade Row Component - Memoized for performance
 * 交易行组件 - 使用 memo 优化性能
 */
const TradeRow = memo(function TradeRow({
  trade,
  style,
  pricePrecision,
  quantityPrecision,
}: {
  trade: Trade;
  style: React.CSSProperties;
  pricePrecision: number;
  quantityPrecision: number;
}) {
  const priceColor = trade.isBuyerMaker ? "text-red-500" : "text-green-500";

  return (
    <div
      style={style}
      className="flex justify-between px-4 text-sm hover:bg-gray-800"
    >
      <span className="text-gray-400">{formatTime(trade.timestamp)}</span>
      <span className={priceColor}>
        {formatPrice(trade.price, pricePrecision)}
      </span>
      <span className="text-gray-300">
        {formatQuantity(trade.quantity, quantityPrecision)}
      </span>
    </div>
  );
});
