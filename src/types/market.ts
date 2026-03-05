/**
 * Market related types
 * 市场相关类型定义
 */

/**
 * Market information / 市场信息
 */
export interface Market {
  symbol: string;              // 交易对符号，如 "BTCUSDT"
  baseAsset: string;           // 基础资产，如 "BTC"
  quoteAsset: string;          // 报价资产，如 "USDT"
  pricePrecision: number;      // 价格精度（小数位数）
  quantityPrecision: number;   // 数量精度（小数位数）
}

export type MarketInfo = Market; // 别名

/**
 * Market connection status / 市场连接状态
 */
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'disconnecting' | 'reconnecting' | 'error';
export type MarketStatus = ConnectionStatus; // 别名

/**
 * Market statistics / 市场统计数据
 */
export interface MarketStats {
  messageRate: number;          // 消息速率（条/秒）
  lastPrice: string;            // 最新成交价
  priceChange24h: number;       // 24小时价格变化百分比
  volume24h: string;            // 24小时成交量
}
