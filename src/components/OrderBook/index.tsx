/**
 * OrderBook Component - Virtualized order book display
 * 订单簿组件 - 虚拟化订单簿显示
 */

"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { List } from "react-window";
import { useOrderBookStore } from "@/stores/orderBookStore";
import { useMarketStore } from "@/stores/marketStore";
import { formatPrice } from "@/lib/utils";
import { aggregateByBucket, getBucketDecimals } from "@/lib/orderBook";
import { BothIcon, BidsIcon, AsksIcon } from "./icons";
import { BidRow, AskRow } from "./OrderRow";
import { RatioBar } from "./RatioBar";
import { PrecisionSelect } from "./PrecisionSelect";

type ViewMode = "both" | "bids" | "asks";

const ROW_HEIGHT = 20;

interface OrderBookProps {
  pricePrecision?: number;
  quantityPrecision?: number;
}

function useContainerHeight(
  ref: React.RefObject<HTMLDivElement | null>,
  dep: unknown,
) {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setHeight(el.clientHeight);
    const observer = new ResizeObserver(() => setHeight(el.clientHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, dep]);
  return height;
}

function withTotal(
  levels: { price: string; quantity: string }[],
  maxRows: number,
) {
  return levels.slice(0, maxRows).map((level, index) => ({
    ...level,
    total: levels
      .slice(0, index + 1)
      .reduce((sum, item) => sum + parseFloat(item.quantity), 0)
      .toString(),
  }));
}

export default function OrderBook({
  pricePrecision = 2,
  quantityPrecision = 6,
}: OrderBookProps) {
  const currentMarket = useMarketStore((state) => state.currentMarket);
  const bids = useOrderBookStore((state) => state.orderBook.bids);
  const asks = useOrderBookStore((state) => state.orderBook.asks);
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [priceBucket, setPriceBucket] = useState<number>(0.01);
  const askContainerRef = useRef<HTMLDivElement>(null);
  const bidContainerRef = useRef<HTMLDivElement>(null);

  const askHeight = useContainerHeight(askContainerRef, viewMode);
  const bidHeight = useContainerHeight(bidContainerRef, viewMode);

  const aggregatedAsks = useMemo(
    () => aggregateByBucket(asks, "asks", priceBucket),
    [asks, priceBucket],
  );
  const aggregatedBids = useMemo(
    () => aggregateByBucket(bids, "bids", priceBucket),
    [bids, priceBucket],
  );

  const asksWithTotal = useMemo(
    () =>
      withTotal(aggregatedAsks, Math.floor(askHeight / ROW_HEIGHT)).reverse(),
    [aggregatedAsks, askHeight],
  );

  const bidsWithTotal = useMemo(
    () => withTotal(aggregatedBids, Math.floor(bidHeight / ROW_HEIGHT)),
    [aggregatedBids, bidHeight],
  );

  const { bidRatio, askRatio } = useMemo(() => {
    const totalBid = bids.reduce((sum, b) => sum + parseFloat(b.quantity), 0);
    const totalAsk = asks.reduce((sum, a) => sum + parseFloat(a.quantity), 0);
    const total = totalBid + totalAsk;
    if (total === 0) return { bidRatio: 50, askRatio: 50 };
    return {
      bidRatio: Math.round((totalBid / total) * 100),
      askRatio: Math.round((totalAsk / total) * 100),
    };
  }, [bids, asks]);

  const currentPrice = bids[0]?.price ?? "0";
  const displayPricePrecision = Math.min(
    pricePrecision,
    getBucketDecimals(priceBucket),
  );

  const VIEW_MODES: { mode: ViewMode; Icon: typeof BothIcon; title: string }[] =
    [
      { mode: "both", Icon: BothIcon, title: "买卖盘" },
      { mode: "bids", Icon: BidsIcon, title: "买盘" },
      { mode: "asks", Icon: AsksIcon, title: "卖盘" },
    ];

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      {/* 顶部控制栏 / Top control bar */}
      <div className="flex items-center px-3 py-2 border-b border-gray-700 gap-2">
        {VIEW_MODES.map(({ mode, Icon, title }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`p-1 rounded hover:bg-gray-700 ${viewMode === mode ? "bg-gray-700" : ""}`}
            title={title}
          >
            <Icon active={viewMode === mode} />
          </button>
        ))}
        <div className="ml-auto">
          <PrecisionSelect value={priceBucket} onChange={setPriceBucket} />
        </div>
      </div>

      {/* 表头 / Header */}
      <div className="flex justify-between px-3 py-1 text-xs text-gray-500">
        <span>价格({currentMarket.quoteAsset})</span>
        <span>数量({currentMarket.baseAsset})</span>
        <span>成交额({currentMarket.quoteAsset})</span>
      </div>

      {/* 卖单区域 / Asks area */}
      {(viewMode === "both" || viewMode === "asks") && (
        <div ref={askContainerRef} className="flex-1 overflow-hidden">
          <List
            style={{ height: askHeight }}
            rowCount={asksWithTotal.length}
            rowHeight={ROW_HEIGHT}
            rowComponent={AskRow}
            rowProps={{
              levels: asksWithTotal,
              pricePrecision: displayPricePrecision,
              quantityPrecision,
            }}
          />
        </div>
      )}

      {/* 当前价格 / Current price */}
      {viewMode === "both" && (
        <div className="flex items-center gap-2 px-3 py-1 border-y border-gray-700 bg-gray-800/50">
          <span className="text-green-400 font-semibold text-sm">
            {formatPrice(currentPrice, displayPricePrecision)}
          </span>
        </div>
      )}

      {/* 买单区域 / Bids area */}
      {(viewMode === "both" || viewMode === "bids") && (
        <div ref={bidContainerRef} className="flex-1 overflow-hidden">
          <List
            style={{ height: bidHeight }}
            rowCount={bidsWithTotal.length}
            rowHeight={ROW_HEIGHT}
            rowComponent={BidRow}
            rowProps={{
              levels: bidsWithTotal,
              pricePrecision: displayPricePrecision,
              quantityPrecision,
            }}
          />
        </div>
      )}

      <RatioBar bidRatio={bidRatio} askRatio={askRatio} />
    </div>
  );
}
