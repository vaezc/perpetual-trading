/**
 * WebSocket Service - Binance Market Data Stream
 * WebSocket 服务 - 币安市场数据流
 */

import { WebSocketConfig, WebSocketStatus, MessageType } from '@/types/websocket';

/**
 * WebSocket Client for Binance Market Streams
 * 币安市场数据流 WebSocket 客户端
 */
export class BinanceWebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private status: WebSocketStatus = 'disconnected';
  private messageHandlers: Map<MessageType, (data: any) => void> = new Map();
  private statusChangeHandlers: ((status: WebSocketStatus) => void)[] = [];

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: config.url || 'wss://stream.binance.com:9443/ws',
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
    };
  }

  /**
   * Connect to WebSocket server
   * 连接到 WebSocket 服务器
   */
  connect(streams: string[]): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    // 构建订阅 URL / Build subscription URL
    const streamParams = streams.join('/');
    const url = `${this.config.url}/${streamParams}`;

    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
      this.updateStatus('connecting');
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.handleReconnect();
    }
  }

  /**
   * Setup WebSocket event handlers
   * 设置 WebSocket 事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.updateStatus('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateStatus('error');
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.updateStatus('disconnected');
      this.stopHeartbeat();
      this.handleReconnect();
    };
  }

  /**
   * Handle incoming messages
   * 处理接收到的消息
   */
  private handleMessage(data: any): void {
    // 币安 WebSocket 消息格式 / Binance WebSocket message format
    const eventType = data.e; // 事件类型 / Event type

    if (eventType === 'depthUpdate') {
      // 订单簿更新 / Order book update
      this.notifyHandlers('orderbook', data);
    } else if (eventType === 'trade') {
      // 交易更新 / Trade update
      this.notifyHandlers('trade', data);
    }
  }

  /**
   * Notify registered handlers
   * 通知已注册的处理器
   */
  private notifyHandlers(type: MessageType, data: any): void {
    const handler = this.messageHandlers.get(type);
    if (handler) {
      handler(data);
    }
  }

  /**
   * Handle reconnection logic
   * 处理重连逻辑
   */
  private handleReconnect(): void {
    const maxAttempts = this.config.maxReconnectAttempts || 10;
    if (this.reconnectAttempts >= maxAttempts) {
      console.error('Max reconnect attempts reached');
      this.updateStatus('error');
      return;
    }

    this.reconnectAttempts++;
    this.updateStatus('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnecting... (${this.reconnectAttempts}/${maxAttempts})`);
      // 需要保存订阅的流以便重连 / Need to save subscribed streams for reconnection
    }, this.config.reconnectInterval);
  }

  /**
   * Start heartbeat to keep connection alive
   * 启动心跳保持连接
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // 币安不需要发送 ping，服务器会自动发送 / Binance doesn't need ping, server sends automatically
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   * 停止心跳定时器
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Update connection status
   * 更新连接状态
   */
  private updateStatus(status: WebSocketStatus): void {
    this.status = status;
    this.statusChangeHandlers.forEach(handler => handler(status));
  }

  /**
   * Register message handler
   * 注册消息处理器
   */
  on(type: MessageType, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Register status change handler
   * 注册状态变化处理器
   */
  onStatusChange(handler: (status: WebSocketStatus) => void): void {
    this.statusChangeHandlers.push(handler);
  }

  /**
   * Get current connection status
   * 获取当前连接状态
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Disconnect from WebSocket server
   * 断开 WebSocket 连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateStatus('disconnected');
  }
}

/**
 * Create Binance stream names
 * 创建币安流名称
 */
export function createBinanceStreams(symbol: string): string[] {
  const normalizedSymbol = symbol.toLowerCase();
  return [
    `${normalizedSymbol}@depth@100ms`,  // 订单簿深度（100ms更新）
    `${normalizedSymbol}@trade`,         // 实时交易
  ];
}

