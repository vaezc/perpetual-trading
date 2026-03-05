/**
 * Data Processor Worker - Process WebSocket data in background
 * 数据处理 Worker - 在后台处理 WebSocket 数据
 */

import { expose } from "comlink";
import type {
  BinanceOrderBookData,
  BinanceTradeData,
  ProcessedTrade,
  PriceLevel,
  ProcessedOrderBook,
} from "@/types/worker";

const MAX_LEVELS = 50;
const MAX_MAP_SIZE = 200; // 限制 Map 大小，防止内存溢出
const ORDER_BOOK_THROTTLE = 100; // 100ms 限流
const TRADE_BATCH_INTERVAL = 100; // 100ms 批处理

const currentBids = new Map<string, string>();
const currentAsks = new Map<string, string>();
let lastOrderBookUpdate = 0;
let tradeBuffer: ProcessedTrade[] = [];
let lastTradeUpdate = 0;

const dataProcessor = {
  /**
   * Reset all state (call on reconnect)
   * 重置所有状态（重连时调用）
   */
  reset() {
    currentBids.clear();
    currentAsks.clear();
    tradeBuffer = [];
    lastOrderBookUpdate = 0;
    lastTradeUpdate = 0;
  },

  /**
   * Process and merge order book data with throttling
   * 处理并合并订单簿数据（带限流）
   */
  processOrderBook(data: BinanceOrderBookData): ProcessedOrderBook | null {
    const now = Date.now();

    // 应用增量更新到内存 / Apply delta to memory
    data.b.forEach(([price, quantity]) => {
      if (parseFloat(quantity) === 0) {
        currentBids.delete(price);
      } else {
        currentBids.set(price, quantity);
      }
    });

    data.a.forEach(([price, quantity]) => {
      if (parseFloat(quantity) === 0) {
        currentAsks.delete(price);
      } else {
        currentAsks.set(price, quantity);
      }
    });

    // Latest-wins: 如果 Map 过大，只保留价格最优的部分
    if (currentBids.size > MAX_MAP_SIZE) {
      const sorted = Array.from(currentBids.entries())
        .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
        .slice(0, MAX_MAP_SIZE);
      currentBids.clear();
      sorted.forEach(([price, quantity]) => currentBids.set(price, quantity));
    }

    if (currentAsks.size > MAX_MAP_SIZE) {
      const sorted = Array.from(currentAsks.entries())
        .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
        .slice(0, MAX_MAP_SIZE);
      currentAsks.clear();
      sorted.forEach(([price, quantity]) => currentAsks.set(price, quantity));
    }

    // 限流：只在间隔时间后返回数据 / Throttle: only return after interval
    if (now - lastOrderBookUpdate < ORDER_BOOK_THROTTLE) {
      return null;
    }

    lastOrderBookUpdate = now;

    // 排序并限制数量 / Sort and limit
    const bids: PriceLevel[] = Array.from(currentBids.entries())
      .map(([price, quantity]) => ({ price, quantity }))
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      .slice(0, MAX_LEVELS);

    const asks: PriceLevel[] = Array.from(currentAsks.entries())
      .map(([price, quantity]) => ({ price, quantity }))
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
      .slice(0, MAX_LEVELS);

    return {
      bids,
      asks,
      lastUpdateId: data.u,
    };
  },

  /**
   * Add trade with batching and throttling (latest-wins)
   * 添加交易（带批处理和限流，保留最新）
   */
  addTrade(data: BinanceTradeData): ProcessedTrade[] | null {
    const trade: ProcessedTrade = {
      id: data.t.toString(),
      price: data.p,
      quantity: data.q,
      timestamp: data.T,
      isBuyerMaker: data.m,
    };

    tradeBuffer.push(trade);

    const now = Date.now();
    if (now - lastTradeUpdate < TRADE_BATCH_INTERVAL) {
      return null;
    }

    lastTradeUpdate = now;
    // Latest-wins: 只返回最新的批次
    const batch = tradeBuffer.slice(-50); // 只保留最新50条
    tradeBuffer = [];
    return batch;
  },
};

expose(dataProcessor);
