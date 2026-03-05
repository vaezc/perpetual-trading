/**
 * Data Processor Worker - Process WebSocket data in background
 * 数据处理 Worker - 在后台处理 WebSocket 数据
 */

import { expose } from "comlink";
import type {
  BinanceOrderBookData,
  BinanceTradeData,
  OrderBookSnapshot,
  OrderBookResult,
  ProcessedTrade,
  PriceLevel,
} from "@/types/worker";

const MAX_LEVELS = 50; // 最终展示的档位数 / Number of levels to display
const ORDER_BOOK_THROTTLE = 20; // 20ms 限流 / 20ms throttle
const TRADE_BATCH_INTERVAL = 50; // 50ms 批处理 / 50ms batch interval

// Order book maps / 订单簿 Map
const currentBids = new Map<string, string>();
const currentAsks = new Map<string, string>();
let lastOrderBookUpdate = 0;

// Sequence gap detection state / 序列缺口检测状态
type SyncState = "waiting_snapshot" | "synced";
let syncState: SyncState = "waiting_snapshot";
let lastProcessedUpdateId = 0; // 上一次成功处理的更新ID / Last successfully processed update ID
let eventBuffer: BinanceOrderBookData[] = []; // 快照到达前的事件缓冲区 / Event buffer before snapshot arrives

// Trade state / 交易状态
let tradeBuffer: ProcessedTrade[] = [];
let lastTradeUpdate = 0;

/**
 * Apply a depth delta to the in-memory maps
 * 将深度增量更新应用到内存 Map
 */
function applyDelta(data: BinanceOrderBookData): void {
  // quantity=0 表示移除该价位 / quantity=0 means remove the price level
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

  // 有了 gap detection 保证顺序正确性后，不再需要 Latest-Wins 裁剪
  // With gap detection ensuring sequence correctness, Latest-Wins trimming is no longer needed
}

/**
 * Build a sorted snapshot from current maps
 * 从当前 Map 构建排序后的快照
 */
function buildSnapshot(
  lastUpdateId: number,
): Extract<OrderBookResult, { type: "data" }> {
  const bids: PriceLevel[] = Array.from(currentBids.entries())
    .map(([price, quantity]) => ({ price, quantity }))
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price)) // 买单降序 / Bids descending
    .slice(0, MAX_LEVELS);

  const asks: PriceLevel[] = Array.from(currentAsks.entries())
    .map(([price, quantity]) => ({ price, quantity }))
    // Keep closest asks: ascending sort then take first MAX_LEVELS
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    .slice(0, MAX_LEVELS);

  return { type: "data", bids, asks, lastUpdateId };
}

const dataProcessor = {
  /**
   * Reset all state (call on reconnect / market switch)
   * 重置所有状态（重连或切换市场时调用）
   */
  reset() {
    currentBids.clear();
    currentAsks.clear();
    lastOrderBookUpdate = 0;
    syncState = "waiting_snapshot"; // 重置为等待快照状态 / Reset to waiting for snapshot
    lastProcessedUpdateId = 0;
    eventBuffer = [];
    tradeBuffer = [];
    lastTradeUpdate = 0;
  },

  /**
   * Initialize order book with a REST snapshot, then replay buffered events.
   * Must be called once after snapshot is fetched, and again after each resync signal.
   *
   * 用 REST 快照初始化订单簿，然后重放缓冲的事件。
   * 首次拉取快照后调用，每次收到 resync 信号后也需重新调用。
   */
  initSnapshot(snapshot: OrderBookSnapshot): void {
    // 用快照数据填充 Map / Populate maps from snapshot
    currentBids.clear();
    currentAsks.clear();
    snapshot.bids.forEach(([price, qty]) => {
      if (parseFloat(qty) > 0) currentBids.set(price, qty);
    });
    snapshot.asks.forEach(([price, qty]) => {
      if (parseFloat(qty) > 0) currentAsks.set(price, qty);
    });

    lastProcessedUpdateId = snapshot.lastUpdateId;

    // 丢弃快照已覆盖的事件（u <= lastUpdateId）/ Discard events already covered by snapshot
    const pending = eventBuffer.filter((e) => e.u > snapshot.lastUpdateId);
    eventBuffer = [];

    // 找到第一个合法事件：U <= lastUpdateId+1 且 u >= lastUpdateId+1
    // Find first valid event: U <= lastUpdateId+1 AND u >= lastUpdateId+1
    const firstIdx = pending.findIndex(
      (e) =>
        e.U <= snapshot.lastUpdateId + 1 && e.u >= snapshot.lastUpdateId + 1,
    );

    if (firstIdx >= 0) {
      for (let i = firstIdx; i < pending.length; i++) {
        const event = pending[i];
        // 合约深度流连续性：pu 必须等于上一事件的 u
        // Futures depth stream continuity: pu must equal previous event's u
        if (i > firstIdx && event.pu !== lastProcessedUpdateId) {
          // 缓冲区内存在缺口，停止重放但仍进入 synced 状态
          // Gap in buffered events — stop replay but still enter synced state
          break;
        }
        applyDelta(event);
        lastProcessedUpdateId = event.u;
      }
    }

    syncState = "synced"; // 同步完成，进入正常处理模式 / Sync complete, enter normal processing mode
    console.log(
      `[Worker] Synced. lastProcessedUpdateId=${lastProcessedUpdateId}, bids=${currentBids.size}, asks=${currentAsks.size}`,
    );
  },

  /**
   * Process a depth update event with sequence gap detection.
   * Returns null when throttled or buffering, { type: 'resync' } when a gap is detected.
   *
   * 处理深度更新事件，带序列缺口检测。
   * 限流或缓冲时返回 null，检测到缺口时返回 { type: 'resync' }。
   */
  processOrderBook(data: BinanceOrderBookData): OrderBookResult {
    // 尚未同步快照，缓冲事件等待 initSnapshot 调用
    // Not yet synced — buffer event until initSnapshot is called
    if (syncState === "waiting_snapshot") {
      eventBuffer.push(data);
      return null;
    }

    // Drop stale/duplicate events that are already covered.
    // 丢弃已被处理覆盖的旧事件/重复事件，避免误判为 gap。
    if (data.u <= lastProcessedUpdateId) {
      return null;
    }

    // 合约深度流连续性校验：当前事件 pu 必须等于上一事件的 u
    // Futures continuity check: current event.pu must equal previous event.u
    if (data.pu !== lastProcessedUpdateId) {
      // 检测到序列缺口，重置状态并通知调用方重新同步
      // Gap detected — reset state and signal caller to re-fetch snapshot
      console.warn(
        `[Worker] Gap detected: U=${data.U}, u=${data.u}, pu=${data.pu}, expected=${lastProcessedUpdateId}`,
      );
      syncState = "waiting_snapshot";
      eventBuffer = [];
      currentBids.clear();
      currentAsks.clear();
      return { type: "resync" };
    }

    applyDelta(data);
    lastProcessedUpdateId = data.u;

    // 限流：只在间隔时间后输出快照 / Throttle: only emit snapshot after interval
    const now = Date.now();
    if (now - lastOrderBookUpdate < ORDER_BOOK_THROTTLE) {
      return null;
    }

    lastOrderBookUpdate = now;
    return buildSnapshot(data.u);
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
    // Latest-wins：只返回最新的批次 / Latest-wins: only return most recent batch
    const batch = tradeBuffer.slice(-50);
    tradeBuffer = [];
    return batch;
  },
};

expose(dataProcessor);
