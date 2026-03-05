/**
 * WebSocket message types
 * WebSocket 消息类型定义
 */

import { OrderBookUpdate, OrderBookSnapshot } from './orderBook';
import { Trade } from './trade';

/**
 * WebSocket connection status / WebSocket 连接状态
 */
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'reconnecting' | 'error';

/**
 * WebSocket configuration / WebSocket 配置
 */
export interface WebSocketConfig {
  url: string;                      // WebSocket 服务器地址
  reconnectInterval?: number;       // 重连间隔（毫秒），默认 3000ms
  maxReconnectAttempts?: number;    // 最大重连次数，默认 10次
}

/**
 * WebSocket message types / WebSocket 消息类型
 */
export type MessageType = 'orderbook' | 'trade' | 'subscribe' | 'unsubscribe' | 'ping' | 'pong';

/**
 * Base WebSocket message / WebSocket 基础消息结构
 */
export interface WebSocketMessage<T = unknown> {
  type: MessageType;    // 消息类型
  data: T;              // 消息数据
  sequence?: number;    // 序列号（用于检测消息丢失）
  timestamp?: number;   // 时间戳
}

/**
 * All possible incoming messages / 所有可能的入站消息类型
 */
export type IncomingMessage = WebSocketMessage;

