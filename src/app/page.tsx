/**
 * Trading Dashboard - Main page with grid layout
 * 交易仪表盘 - 网格布局主页面
 */

"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import OrderBook from "@/components/OrderBook";
import { OrderBookSkeleton } from "@/components/OrderBook/Skeleton";
import TradeTape from "@/components/TradeTape";
import { TradeTapeSkeleton } from "@/components/TradeTape/Skeleton";
import OrderEntry from "@/components/OrderEntry";
import MarketSelector from "@/components/MarketSelector";
import ConnectionStatus from "@/components/ConnectionStatus";
import MessageRate from "@/components/MessageRate";
import GridPanel from "@/components/GridPanel";
import KLineChart from "@/components/KLineChart";
import { Button } from "@/components/ui/button";
import { useMarketStore } from "@/stores/marketStore";
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

export default function Home() {
  const currentMarket = useMarketStore((state) => state.currentMarket);
  const connectionStatus = useMarketStore((state) => state.connectionStatus);
  const streamError = useMarketStore((state) => state.streamError);
  const requestRetry = useMarketStore((state) => state.requestRetry);
  const setStreamError = useMarketStore((state) => state.setStreamError);
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
    initialWidth: 0,
  });
  const ready = mounted && width > 0;
  const isLoading =
    connectionStatus === "connecting" || connectionStatus === "reconnecting";

  // 连接 WebSocket
  useWebSocket(currentMarket.symbol);

  // 网格布局配置
  const layouts = {
    lg: [
      { i: "kline", x: 0, y: 0, w: 9, h: 14 },
      { i: "order-entry", x: 9, y: 0, w: 3, h: 14 },
      { i: "orderbook", x: 0, y: 14, w: 3, h: 14 },
      { i: "trades", x: 3, y: 14, w: 3, h: 14 },
    ],
    md: [
      { i: "kline", x: 0, y: 0, w: 10, h: 14 },
      { i: "orderbook", x: 0, y: 14, w: 5, h: 14 },
      { i: "trades", x: 5, y: 14, w: 5, h: 14 },
      { i: "order-entry", x: 0, y: 28, w: 10, h: 14 },
    ],
    sm: [
      { i: "kline", x: 0, y: 0, w: 6, h: 14 },
      { i: "orderbook", x: 0, y: 14, w: 6, h: 12 },
      { i: "trades", x: 0, y: 26, w: 6, h: 12 },
      { i: "order-entry", x: 0, y: 38, w: 6, h: 14 },
    ],
    xs: [
      { i: "kline", x: 0, y: 0, w: 4, h: 14 },
      { i: "orderbook", x: 0, y: 14, w: 4, h: 12 },
      { i: "trades", x: 0, y: 26, w: 4, h: 12 },
      { i: "order-entry", x: 0, y: 38, w: 4, h: 14 },
    ],
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header / 顶部栏 */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800 shrink-0">
        <h1 className="text-sm font-semibold text-white tracking-wide">
          Perpetual Trading
        </h1>
        <div className="flex items-center gap-3">
          <MarketSelector />
          <div className="w-px h-4 bg-gray-700" />
          <ConnectionStatus />
          <div className="w-px h-4 bg-gray-700" />
          <MessageRate />
        </div>
      </header>

      {streamError && (
        <div className="px-4 py-2 border-b border-red-800 bg-red-950/40 flex items-center justify-between gap-3">
          <p className="text-xs text-red-300">{streamError}</p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setStreamError(null);
                requestRetry();
              }}
              className="h-7 px-2 text-xs border-red-700 text-red-200 hover:bg-red-900/40 hover:text-red-100"
            >
              重试
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStreamError(null)}
              className="h-7 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800"
            >
              关闭
            </Button>
          </div>
        </div>
      )}

      {/* Grid Layout / 网格布局 */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {ready ? (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={30}
            width={width}
            margin={[8, 8]}
            containerPadding={[8, 8]}
            draggableHandle=".drag-handle"
            draggableCancel=".no-drag"
          >
            <div key="kline">
              <GridPanel>
                <KLineChart symbol={currentMarket.symbol} />
              </GridPanel>
            </div>
            <div key="orderbook">
              <GridPanel isLoading={isLoading} skeleton={<OrderBookSkeleton />}>
                <OrderBook
                  pricePrecision={currentMarket.pricePrecision}
                  quantityPrecision={currentMarket.quantityPrecision}
                />
              </GridPanel>
            </div>
            <div key="trades">
              <GridPanel isLoading={isLoading} skeleton={<TradeTapeSkeleton />}>
                <TradeTape
                  pricePrecision={currentMarket.pricePrecision}
                  quantityPrecision={currentMarket.quantityPrecision}
                />
              </GridPanel>
            </div>
            <div key="order-entry">
              <GridPanel>
                <OrderEntry />
              </GridPanel>
            </div>
          </ResponsiveGridLayout>
        ) : (
          <div className="h-full p-2">
            <div className="h-full rounded-lg border border-gray-800 bg-gray-900/40 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
