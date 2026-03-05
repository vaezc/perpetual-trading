/**
 * Order Book related types
 * 订单簿相关类型定义
 */

/**
 * Price level in order book / 订单簿价格档位
 */
export interface PriceLevel {
  price: string;      // 价格（字符串保证精度）
  quantity: string;   // 数量（字符串保证精度）
  total?: string;     // 累计数量（用于显示深度）
}

/**
 * Complete order book state / 完整订单簿状态
 */
export interface OrderBook {
  bids: PriceLevel[];     // 买单列表（按价格从高到低排序）
  asks: PriceLevel[];     // 卖单列表（按价格从低到高排序）
  lastUpdateId: number;   // 最后更新序列号
  timestamp?: number;     // 时间戳（可选）
}

/**
 * Order book incremental update / 订单簿增量更新
 */
export interface OrderBookUpdate {
  bids: [number, number][]; // 买单更新 [价格, 数量]
  asks: [number, number][]; // 卖单更新 [价格, 数量]
  updateId: number;         // 更新序列号
  timestamp: number;        // 时间戳
}

/**
 * Order book snapshot / 订单簿快照（用于初始化或重置）
 */
export interface OrderBookSnapshot {
  bids: [number, number][];  // 买单快照 [价格, 数量]
  asks: [number, number][];  // 卖单快照 [价格, 数量]
  lastUpdateId: number;      // 快照序列号
}

/**
 * Order side / 订单方向
 */
export type OrderSide = 'buy' | 'sell';
