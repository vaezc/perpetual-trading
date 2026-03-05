/**
 * WebSocket Service - Binance Market Data Stream
 * WebSocket 服务 - 币安市场数据流
 */

import {
  WebSocketConfig,
  WebSocketStatus,
  MessageType,
} from "@/types/websocket";

type MessageHandler = (data: unknown) => void;

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
  private status: WebSocketStatus = "disconnected";
  private messageHandlers: Map<MessageType, MessageHandler> = new Map();
  private statusChangeHandlers: ((status: WebSocketStatus) => void)[] = [];
  private intentionalClose = false;
  private currentStreams: string[] = [];

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      // Binance USD-M futures combined stream endpoint
      url: config.url || "wss://fstream.binance.com",
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
    };
  }

  connect(streams: string[]): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.warn("WebSocket already connected");
      return;
    }

    this.intentionalClose = false;
    this.currentStreams = streams;

    const streamParams = streams.join("/");
    const url = `${this.config.url}/stream?streams=${streamParams}`;

    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
      this.updateStatus("connecting");
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.updateStatus("connected");
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };

    this.ws.onerror = () => {
      this.updateStatus("error");
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.updateStatus("disconnected");
      // 只有非主动断开才触发重连 / Only reconnect if not intentionally closed
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  private handleMessage(data: unknown): void {
    if (isObjectWithStream(data)) {
      const eventData = data.data;
      if (!isObjectWithEventType(eventData)) return;

      const eventType = eventData.e;
      if (eventType === "depthUpdate") {
        this.notifyHandlers("orderbook", eventData);
      } else if (eventType === "trade") {
        this.notifyHandlers("trade", eventData);
      }
    }
  }

  private notifyHandlers(type: MessageType, data: unknown): void {
    const handler = this.messageHandlers.get(type);
    if (handler) handler(data);
  }

  private scheduleReconnect(): void {
    const maxAttempts = this.config.maxReconnectAttempts ?? 10;
    if (this.reconnectAttempts >= maxAttempts) {
      console.error("Max reconnect attempts reached");
      this.updateStatus("error");
      return;
    }

    this.reconnectAttempts++;
    this.updateStatus("reconnecting");

    this.reconnectTimer = setTimeout(() => {
      if (!this.intentionalClose && this.currentStreams.length > 0) {
        this.connect(this.currentStreams);
      }
    }, this.config.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      // Binance server sends pings automatically, no client ping needed
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private updateStatus(status: WebSocketStatus): void {
    this.status = status;
    this.statusChangeHandlers.forEach((handler) => handler(status));
  }

  on(type: MessageType, handler: MessageHandler): void {
    this.messageHandlers.set(type, handler);
  }

  onStatusChange(handler: (status: WebSocketStatus) => void): void {
    this.statusChangeHandlers.push(handler);
  }

  getStatus(): WebSocketStatus {
    return this.status;
  }

  disconnect(): void {
    this.intentionalClose = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateStatus("disconnected");
  }
}

export function createBinanceStreams(symbol: string): string[] {
  const s = symbol.toLowerCase();
  return [`${s}@depth@100ms`, `${s}@trade`];
}

function isObjectWithEventType(data: unknown): data is { e: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { e?: unknown }).e === "string"
  );
}

function isObjectWithStream(
  data: unknown,
): data is { stream: string; data: unknown } {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { stream?: unknown }).stream === "string" &&
    "data" in data
  );
}
