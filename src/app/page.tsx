/**
 * Trading Dashboard - Main page with grid layout
 * 交易仪表盘 - 网格布局主页面
 */

"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import OrderBook from "@/components/OrderBook";
import TradeTape from "@/components/TradeTape";
import OrderEntry from "@/components/OrderEntry";
import MarketSelector from "@/components/MarketSelector";
import ConnectionStatus from "@/components/ConnectionStatus";
import MessageRate from "@/components/MessageRate";
import GridPanel from "@/components/GridPanel";
import { useMarketStore } from "@/stores/marketStore";
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

export default function Home() {
  const currentMarket = useMarketStore((state) => state.currentMarket);
  const { width, containerRef } = useContainerWidth();

  // 连接 WebSocket
  useWebSocket(currentMarket.symbol);

  // 网格布局配置
  const layouts = {
    lg: [
      { i: "orderbook", x: 0, y: 0, w: 3, h: 14 },
      { i: "trades", x: 3, y: 0, w: 3, h: 14 },
      { i: "order-entry", x: 6, y: 0, w: 6, h: 14 },
    ],
    md: [
      { i: "orderbook", x: 0, y: 0, w: 5, h: 14 },
      { i: "trades", x: 5, y: 0, w: 5, h: 14 },
      { i: "order-entry", x: 0, y: 14, w: 10, h: 14 },
    ],
    sm: [
      { i: "orderbook", x: 0, y: 0, w: 6, h: 12 },
      { i: "trades", x: 0, y: 12, w: 6, h: 12 },
      { i: "order-entry", x: 0, y: 24, w: 6, h: 14 },
    ],
    xs: [
      { i: "orderbook", x: 0, y: 0, w: 4, h: 12 },
      { i: "trades", x: 0, y: 12, w: 4, h: 12 },
      { i: "order-entry", x: 0, y: 24, w: 4, h: 14 },
    ],
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header / 顶部栏 */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <h1 className="text-xl font-bold">Perpetual Trading</h1>
        <div className="flex items-center gap-4">
          <MarketSelector />
          <ConnectionStatus />
          <MessageRate />
        </div>
      </header>

      {/* Grid Layout / 网格布局 */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          width={width}
          margin={[8, 8]}
          containerPadding={[8, 8]}
        >
          <div key="orderbook">
            <GridPanel>
              <OrderBook
                pricePrecision={currentMarket.pricePrecision}
                quantityPrecision={currentMarket.quantityPrecision}
              />
            </GridPanel>
          </div>
          <div key="trades">
            <GridPanel>
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
      </div>
    </div>
  );
}
