/**
 * useWebSocket Hook - Connect WebSocket service with Zustand stores
 * WebSocket Hook - 连接 WebSocket 服务和 Zustand 状态管理
 */

import { useEffect, useRef, startTransition } from "react";
import {
  BinanceWebSocketClient,
  createBinanceStreams,
} from "@/services/websocket";
import { useOrderBookStore } from "@/stores/orderBookStore";
import { useTradeStore } from "@/stores/tradeStore";
import { useMarketStore } from "@/stores/marketStore";
import { useDataProcessor } from "./useDataProcessor";
import type { BinanceOrderBookData, BinanceTradeData } from "@/types/worker";

const RATE_INTERVAL_MS = 1000;

export function useWebSocket(symbol: string) {
  const wsClient = useRef<BinanceWebSocketClient | null>(null);
  const setOrderBook = useOrderBookStore((state) => state.setOrderBook);
  const addTrades = useTradeStore((state) => state.addTrades);
  const setConnectionStatus = useMarketStore(
    (state) => state.setConnectionStatus,
  );
  const updateStats = useMarketStore((state) => state.updateStats);
  const resetOrderBook = useOrderBookStore((state) => state.reset);
  const resetTrades = useTradeStore((state) => state.reset);
  const processor = useDataProcessor();
  const msgCount = useRef(0);

  useEffect(() => {
    if (!processor) return;

    // 切换市场时清空旧数据 / Clear stale data on market switch
    resetOrderBook();
    resetTrades();
    // Fire-and-forget reset，worker 内部同步执行无需等待结果
    void processor.reset();

    // 创建 WebSocket 客户端 / Create WebSocket client
    wsClient.current = new BinanceWebSocketClient();

    // 处理订单簿数据 / Handle order book data
    const handleOrderBook = async (data: unknown) => {
      msgCount.current++;
      const processed = await processor.processOrderBook(
        data as BinanceOrderBookData,
      );
      if (processed) {
        setOrderBook(processed.bids, processed.asks, processed.lastUpdateId);
      }
    };

    // 处理交易数据 / Handle trade data
    const handleTrade = async (data: unknown) => {
      msgCount.current++;
      const batch = await processor.addTrade(data as BinanceTradeData);
      if (batch && batch.length > 0) {
        // 标记为非紧急更新，React 可在有更高优先级任务时推迟渲染
        startTransition(() => addTrades(batch));
      }
    };

    // 每秒统计消息速率 / Calculate message rate every second
    const rateTimer = setInterval(() => {
      updateStats({ messageRate: msgCount.current });
      msgCount.current = 0;
    }, RATE_INTERVAL_MS);

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
      clearInterval(rateTimer);
      wsClient.current?.disconnect();
    };
  }, [symbol, setOrderBook, addTrades, setConnectionStatus, updateStats, resetOrderBook, resetTrades, processor]);
}
