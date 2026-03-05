/**
 * Worker Types - Type definitions for Web Worker
 * Worker 类型 - Web Worker 的类型定义
 */

export interface BinanceOrderBookData {
  U: number;             // First update ID in event / 本次事件首个更新ID
  u: number;             // Final update ID in event / 本次事件末个更新ID
  pu: number;            // Previous final update ID / 上一事件末个更新ID（合约流）
  b: [string, string][]; // Bids / 买单
  a: [string, string][]; // Asks / 卖单
}

export interface BinanceTradeData {
  t: number;   // trade id
  p: string;   // price
  q: string;   // quantity
  T: number;   // timestamp
  m: boolean;  // is buyer maker
}

export interface OrderBookSnapshot {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export interface ProcessedTrade {
  id: string;
  price: string;
  quantity: string;
  timestamp: number;
  isBuyerMaker: boolean;
}

export interface PriceLevel {
  price: string;
  quantity: string;
}

/** null = throttled/buffering, resync = gap detected, data = normal output */
export type OrderBookResult =
  | { type: "data"; bids: PriceLevel[]; asks: PriceLevel[]; lastUpdateId: number }
  | { type: "resync" }
  | null;
