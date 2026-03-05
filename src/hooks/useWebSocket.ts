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
import type {
  BinanceOrderBookData,
  BinanceTradeData,
  OrderBookSnapshot,
} from "@/types/worker";

const RATE_INTERVAL_MS = 1000; // 消息速率统计间隔 / Message rate calculation interval
const SNAPSHOT_LIMIT = 1000; // REST 快照深度档位数 / REST snapshot depth
const BINANCE_REST = "https://fapi.binance.com/fapi/v1";

export function useWebSocket(symbol: string) {
  const wsClient = useRef<BinanceWebSocketClient | null>(null);
  const setOrderBook = useOrderBookStore((state) => state.setOrderBook);
  const addTrades = useTradeStore((state) => state.addTrades);
  const setConnectionStatus = useMarketStore(
    (state) => state.setConnectionStatus,
  );
  const updateStats = useMarketStore((state) => state.updateStats);
  const setStreamError = useMarketStore((state) => state.setStreamError);
  const retryNonce = useMarketStore((state) => state.retryNonce);
  const resetOrderBook = useOrderBookStore((state) => state.reset);
  const resetTrades = useTradeStore((state) => state.reset);
  const processor = useDataProcessor();
  const msgCount = useRef(0);

  useEffect(() => {
    if (!processor) return;

    setStreamError(null);
    let active = true;

    // 切换市场时清空旧数据 / Clear stale data on market switch
    resetOrderBook();
    resetTrades();
    // Fire-and-forget reset，worker 内部同步执行无需等待结果
    // Fire-and-forget reset — worker executes synchronously, no need to await
    void processor.reset();

    // 创建 WebSocket 客户端 / Create WebSocket client
    wsClient.current = new BinanceWebSocketClient();

    /**
     * Fetch REST snapshot and pass it to the worker.
     * Called once on connect, and again whenever the worker signals a sequence gap.
     * 拉取 REST 快照并传给 Worker。
     * 连接时调用一次，Worker 检测到序列缺口时再次调用。
     */
    const fetchAndInitSnapshot = async (reason: "init" | "resync") => {
      if (!active) return false;
      try {
        const res = await fetch(
          `${BINANCE_REST}/depth?symbol=${symbol}&limit=${SNAPSHOT_LIMIT}`,
        );
        if (!res.ok) {
          console.error(
            `[OrderBook] Snapshot fetch failed: HTTP ${res.status}`,
          );
          setStreamError(
            reason === "resync"
              ? "订单簿重同步失败，请重试。"
              : "订单簿快照拉取失败，请重试。",
          );
          return false;
        }
        const snapshot = (await res.json()) as OrderBookSnapshot;
        // 检查 effect 是否已清理，避免旧快照覆盖新状态
        // Check if effect was cleaned up to avoid stale snapshot overwriting new state
        if (active) {
          await processor.initSnapshot(snapshot);
          setStreamError(null);
        }
        return true;
      } catch (err) {
        console.error(
          "Failed to fetch order book snapshot / 快照拉取失败:",
          err,
        );
        setStreamError(
          reason === "resync"
            ? "订单簿重同步失败，请重试。"
            : "订单簿快照拉取失败，请重试。",
        );
        return false;
      }
    };

    // 处理订单簿数据 / Handle order book data
    const handleOrderBook = async (data: unknown) => {
      if (!active) return;
      msgCount.current++;
      const result = await processor.processOrderBook(
        data as BinanceOrderBookData,
      );
      if (!active) return;

      if (!result) return; // 限流或缓冲中 / Throttled or buffering

      if (result.type === "resync") {
        // 检测到序列缺口，重新拉取快照重新同步
        // Sequence gap detected — re-fetch snapshot to resync
        console.warn("[OrderBook] Sequence gap detected, resyncing...");
        void fetchAndInitSnapshot("resync");
        return;
      }

      setOrderBook(result.bids, result.asks, result.lastUpdateId);
    };

    // 处理交易数据 / Handle trade data
    const handleTrade = async (data: unknown) => {
      if (!active) return;
      msgCount.current++;
      const batch = await processor.addTrade(data as BinanceTradeData);
      if (!active) return;
      if (batch && batch.length > 0) {
        // 标记为非紧急更新，React 可在有更高优先级任务时推迟渲染
        // Mark as non-urgent update — React may defer rendering if higher-priority work exists
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
      if (!active) return;
      setConnectionStatus(status);
    });

    // 连接 WebSocket，连接成功后立即拉取快照
    // Connect WebSocket, then immediately fetch snapshot
    const streams = createBinanceStreams(symbol);
    wsClient.current.connect(streams);
    void fetchAndInitSnapshot("init");

    // 清理函数 / Cleanup function
    return () => {
      active = false; // 标记已清理，阻止过期操作写入状态 / Mark as cleaned up to block stale operations from writing state
      clearInterval(rateTimer);
      wsClient.current?.disconnect();
    };
  }, [
    symbol,
    setOrderBook,
    addTrades,
    setConnectionStatus,
    updateStats,
    setStreamError,
    retryNonce,
    resetOrderBook,
    resetTrades,
    processor,
  ]);
}
