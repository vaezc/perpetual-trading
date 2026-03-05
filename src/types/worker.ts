/**
 * Worker Types - Type definitions for Web Worker
 * Worker 类型 - Web Worker 的类型定义
 */

export interface BinanceOrderBookData {
  b: [string, string][]; // bids
  a: [string, string][]; // asks
  u: number; // update id
}

export interface BinanceTradeData {
  t: number; // trade id
  p: string; // price
  q: string; // quantity
  T: number; // timestamp
  m: boolean; // is buyer maker
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

export interface ProcessedOrderBook {
  bids: PriceLevel[];
  asks: PriceLevel[];
  lastUpdateId: number;
}
