/**
 * OrderBook Component - Virtualized order book display
 * 订单簿组件 - 虚拟化订单簿显示
 */

"use client";

import { memo, useMemo, useCallback } from "react";
import { List as FixedSizeList } from "react-window";
import { useOrderBookStore } from "@/stores/orderBookStore";
import { PriceLevel } from "@/types/orderBook";
import { formatPrice, formatQuantity } from "@/lib/utils";

interface OrderBookProps {
  height?: number;
  pricePrecision?: number;
  quantityPrecision?: number;
}

export default function OrderBook({
  pricePrecision = 2,
  quantityPrecision = 6,
}: OrderBookProps) {
  const bids = useOrderBookStore((state) => state.orderBook.bids);
  const asks = useOrderBookStore((state) => state.orderBook.asks);

  // 使用 useMemo 缓存计算结果
  const asksWithTotal = useMemo(
    () =>
      asks
        .map((ask, index) => {
          const total = asks
            .slice(0, index + 1)
            .reduce((sum, item) => sum + parseFloat(item.quantity), 0)
            .toString();
          return { ...ask, total };
        })
        .reverse(),
    [asks]
  );

  const bidsWithTotal = useMemo(
    () =>
      bids.map((bid, index) => {
        const total = bids
          .slice(0, index + 1)
          .reduce((sum, item) => sum + parseFloat(item.quantity), 0)
          .toString();
        return { ...bid, total };
      }),
    [bids]
  );

  const AskRowComponent = useCallback(
    ({ index, style }: any) => (
      <AskRow
        level={asksWithTotal[index]}
        style={style}
        pricePrecision={pricePrecision}
        quantityPrecision={quantityPrecision}
      />
    ),
    [asksWithTotal, pricePrecision, quantityPrecision]
  );

  const BidRowComponent = useCallback(
    ({ index, style }: any) => (
      <BidRow
        level={bidsWithTotal[index]}
        style={style}
        pricePrecision={pricePrecision}
        quantityPrecision={quantityPrecision}
      />
    ),
    [bidsWithTotal, pricePrecision, quantityPrecision]
  );

  // 当前价格（使用第一个买单价格）
  const currentPrice = bids[0]?.price || "0";

  return (
    <div className="flex flex-col h-full border rounded-lg bg-gray-900">
      {/* Header / 表头 */}
      <div className="flex justify-between px-4 py-2 text-xs text-gray-400 border-b border-gray-700">
        <span>价格(USDT)</span>
        <span>数量(BTC)</span>
        <span>累计(BTC)</span>
      </div>

      {/* Asks / 卖单 */}
      <div className="flex-1 overflow-hidden">
        <FixedSizeList
          style={{ height: 250 }}
          rowCount={asksWithTotal.length}
          rowHeight={20}
          rowComponent={AskRowComponent}
          rowProps={{}}
        />
      </div>

      {/* Bids / 买单 */}
      <div className="flex-1 overflow-hidden">
        <FixedSizeList
          style={{ height: 250 }}
          rowCount={bidsWithTotal.length}
          rowHeight={20}
          rowComponent={BidRowComponent}
          rowProps={{}}
        />
      </div>
    </div>
  );
}

/**
 * Bid Row Component - Memoized for performance
 * 买单行组件 - 使用 memo 优化性能
 */
const BidRow = memo(function BidRow({
  level,
  style,
  pricePrecision,
  quantityPrecision,
}: {
  level: PriceLevel;
  style: React.CSSProperties;
  pricePrecision: number;
  quantityPrecision: number;
}) {
  return (
    <div
      style={style}
      className="flex justify-between px-4 text-sm hover:bg-gray-800"
    >
      <span className="text-green-500">
        {formatPrice(level.price, pricePrecision)}
      </span>
      <span className="text-gray-300">
        {formatQuantity(level.quantity, quantityPrecision)}
      </span>
      <span className="text-gray-400">
        {level.total ? formatQuantity(level.total, quantityPrecision) : "-"}
      </span>
    </div>
  );
});

/**
 * Ask Row Component - Memoized for performance
 * 卖单行组件 - 使用 memo 优化性能
 */
const AskRow = memo(function AskRow({
  level,
  style,
  pricePrecision,
  quantityPrecision,
}: {
  level: PriceLevel;
  style: React.CSSProperties;
  pricePrecision: number;
  quantityPrecision: number;
}) {
  return (
    <div
      style={style}
      className="flex justify-between px-4 text-sm hover:bg-gray-800"
    >
      <span className="text-red-500">
        {formatPrice(level.price, pricePrecision)}
      </span>
      <span className="text-gray-300">
        {formatQuantity(level.quantity, quantityPrecision)}
      </span>
      <span className="text-gray-400">
        {level.total ? formatQuantity(level.total, quantityPrecision) : "-"}
      </span>
    </div>
  );
});
