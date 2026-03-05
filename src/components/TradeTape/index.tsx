/**
 * TradeTape Component - Virtualized trade history display
 * 交易流水组件 - 虚拟化交易历史显示
 */

"use client";

import { CSSProperties, useEffect, useRef } from "react";
import { List } from "react-window";
import type { ListImperativeAPI } from "react-window";
import { useTradeStore } from "@/stores/tradeStore";
import { useMarketStore } from "@/stores/marketStore";
import { Trade } from "@/types/trade";
import { formatPrice, formatQuantity, formatTime } from "@/lib/utils";

interface TradeTapeProps {
  pricePrecision?: number;
  quantityPrecision?: number;
}

// Only extra props passed via rowProps — index/style injected by the library
interface TradeRowListProps {
  trades: Trade[];
  pricePrecision: number;
  quantityPrecision: number;
}

type Injected = { index: number; style: CSSProperties };

function TradeRow(props: TradeRowListProps) {
  const { index, style, trades, pricePrecision, quantityPrecision } =
    props as TradeRowListProps & Injected;
  const trade = trades[index];
  const isBuy = !trade.isBuyerMaker;

  return (
    <div
      style={style}
      className="flex items-center justify-between px-3 text-xs hover:bg-gray-800/60 transition-colors"
    >
      <span className="text-gray-500 tabular-nums w-14 shrink-0">
        {formatTime(trade.timestamp)}
      </span>
      <span
        className={`tabular-nums font-medium ${isBuy ? "text-green-400" : "text-red-400"}`}
      >
        {isBuy ? "▲" : "▼"} {formatPrice(trade.price, pricePrecision)}
      </span>
      <span className="text-gray-400 tabular-nums">
        {formatQuantity(trade.quantity, quantityPrecision)}
      </span>
    </div>
  );
}

export default function TradeTape({
  pricePrecision = 2,
  quantityPrecision = 6,
}: TradeTapeProps) {
  const trades = useTradeStore((state) => state.trades);
  const currentMarket = useMarketStore((state) => state.currentMarket);
  const listRef = useRef<ListImperativeAPI | null>(null);

  // Auto-scroll to top when new trades arrive
  useEffect(() => {
    listRef.current?.element?.scrollTo({ top: 0 });
  }, [trades.length]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500 border-b border-gray-700">
        <span className="w-14 shrink-0">时间</span>
        <span>价格({currentMarket.quoteAsset})</span>
        <span>数量({currentMarket.baseAsset})</span>
      </div>

      {/* Trade List */}
      <div className="flex-1 overflow-hidden">
        <List
          listRef={listRef}
          rowCount={trades.length}
          rowHeight={22}
          rowComponent={TradeRow}
          rowProps={{ trades, pricePrecision, quantityPrecision }}
        />
      </div>
    </div>
  );
}
