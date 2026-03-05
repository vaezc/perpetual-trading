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
import { useDataProcessor } from "./useDataProcessor";
import type { BinanceOrderBookData, BinanceTradeData } from "@/types/worker";

export function useWebSocket(symbol: string) {
  const wsClient = useRef<BinanceWebSocketClient | null>(null);
  const setOrderBook = useOrderBookStore((state) => state.setOrderBook);
  const addTrades = useTradeStore((state) => state.addTrades);
  const setConnectionStatus = useMarketStore(
    (state) => state.setConnectionStatus,
  );
  const processor = useDataProcessor();

  useEffect(() => {
    if (!processor) return;

    // 重置 Worker 状态 / Reset worker state
    processor.reset();

    // 创建 WebSocket 客户端 / Create WebSocket client
    wsClient.current = new BinanceWebSocketClient();

    // 处理订单簿数据 / Handle order book data
    const handleOrderBook = async (data: unknown) => {
      const processed = await processor.processOrderBook(
        data as BinanceOrderBookData,
      );
      if (processed) {
        setOrderBook(processed.bids, processed.asks, processed.lastUpdateId);
      }
    };

    // 处理交易数据 / Handle trade data
    const handleTrade = async (data: unknown) => {
      const batch = await processor.addTrade(data as BinanceTradeData);
      if (batch && batch.length > 0) {
        addTrades(batch);
      }
    };

    // 注册消息处理器 / Register message handlers
    wsClient.current.on("orderbook", handleOrderBook);
    wsClient.current.on("trade", handleTrade);

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
  }, [symbol, setOrderBook, addTrades, setConnectionStatus, processor]);
}
