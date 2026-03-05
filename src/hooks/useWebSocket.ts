/**
 * useWebSocket Hook - Connect WebSocket service with Zustand stores
 * WebSocket Hook - 连接 WebSocket 服务和 Zustand 状态管理
 */

import { useEffect, useRef } from "react";
import {
  BinanceWebSocketClient,
  createBinanceStreams,
} from "@/services/websocket";
import { useOrderBookStore } from "@/stores/orderBookStore";
import { useTradeStore } from "@/stores/tradeStore";
import { useMarketStore } from "@/stores/marketStore";
import { batchUpdates } from "@/lib/utils";

export function useWebSocket(symbol: string) {
  const wsClient = useRef<BinanceWebSocketClient | null>(null);
  const updateOrderBook = useOrderBookStore((state) => state.updateOrderBook);
  const addTrades = useTradeStore((state) => state.addTrades);
  const setConnectionStatus = useMarketStore(
    (state) => state.setConnectionStatus,
  );

  useEffect(() => {
    // 创建 WebSocket 客户端 / Create WebSocket client
    wsClient.current = new BinanceWebSocketClient();

    // 批量更新订单簿 / Batch update order book
    const batchedOrderBookUpdate = batchUpdates<
      Parameters<typeof updateOrderBook>[0]
    >((items) => {
      items.forEach((data) => updateOrderBook(data));
    });

    // 批量更新交易 / Batch update trades
    const batchedTradeUpdate = batchUpdates<any>((items) => {
      addTrades(items);
    });

    // 注册消息处理器 / Register message handlers
    wsClient.current.on("orderbook", batchedOrderBookUpdate);
    wsClient.current.on("trade", batchedTradeUpdate);

    // 注册状态变化处理器 / Register status change handler
    wsClient.current.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // 连接 WebSocket / Connect WebSocket
    const streams = createBinanceStreams(symbol);
    wsClient.current.connect(streams);

    // 清理函数 / Cleanup function
    return () => {
      wsClient.current?.disconnect();
    };
  }, [symbol, updateOrderBook, addTrades, setConnectionStatus]);
}
