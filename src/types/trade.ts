/**
 * Trade related types
 * 交易记录相关类型定义
 */

/**
 * Single trade / 单笔交易
 */
export interface Trade {
  id: string;             // 交易ID
  price: string;          // 成交价格
  quantity: string;       // 成交数量
  timestamp: number;      // 成交时间戳
  isBuyerMaker: boolean;  // 买方是否为挂单方 (true = 卖单成交/红色, false = 买单成交/绿色)
}

/**
 * Trade update message / 交易更新消息
 */
export interface TradeUpdate {
  trades: Trade[];    // 交易列表
  timestamp: number;  // 更新时间戳
}
