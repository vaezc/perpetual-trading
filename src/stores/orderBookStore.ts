/**
 * Order Book Store - Zustand state management
 * 订单簿状态管理
 */

import { create } from "zustand";
import { OrderBook, PriceLevel } from "@/types/orderBook";

interface OrderBookState {
  orderBook: OrderBook;
  lastUpdateId: number;
  setOrderBook: (bids: PriceLevel[], asks: PriceLevel[], updateId: number) => void;
  reset: () => void;
}

const initialOrderBook: OrderBook = {
  bids: [],
  asks: [],
  lastUpdateId: 0,
};

export const useOrderBookStore = create<OrderBookState>((set) => ({
  orderBook: initialOrderBook,
  lastUpdateId: 0,

  /**
   * Set order book with processed data from worker
   * 使用 worker 处理后的数据设置订单簿
   */
  setOrderBook: (bids: PriceLevel[], asks: PriceLevel[], updateId: number) => {
    set({
      orderBook: {
        bids,
        asks,
        lastUpdateId: updateId,
      },
      lastUpdateId: updateId,
    });
  },

  reset: () => set({ orderBook: initialOrderBook, lastUpdateId: 0 }),
}));
