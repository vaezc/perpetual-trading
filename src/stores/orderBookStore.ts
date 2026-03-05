/**
 * Order Book Store - Zustand state management
 * 订单簿状态管理
 */

import { create } from 'zustand';
import { OrderBook, PriceLevel } from '@/types/orderBook';

interface OrderBookState {
  orderBook: OrderBook;
  lastUpdateId: number;
  updateOrderBook: (data: any) => void;
  reset: () => void;
}

const MAX_LEVELS = 12; // 固定显示12档

const initialOrderBook: OrderBook = {
  bids: [],
  asks: [],
  lastUpdateId: 0,
};

export const useOrderBookStore = create<OrderBookState>((set) => ({
  orderBook: initialOrderBook,
  lastUpdateId: 0,

  /**
   * Update order book with delta data
   * 使用增量数据更新订单簿
   */
  updateOrderBook: (data: any) => {
    set((state) => {
      const { b: bids, a: asks, u: updateId } = data;

      // 应用增量更新并限制档位数量
      const newBids = applyDeltas(state.orderBook.bids, bids, MAX_LEVELS);
      const newAsks = applyDeltas(state.orderBook.asks, asks, MAX_LEVELS);

      return {
        orderBook: {
          bids: newBids,
          asks: newAsks,
          lastUpdateId: updateId,
        },
        lastUpdateId: updateId,
      };
    });
  },

  reset: () => set({ orderBook: initialOrderBook, lastUpdateId: 0 }),
}));

/**
 * Apply delta updates to price levels
 * 应用增量更新到价格档位
 */
function applyDeltas(
  currentLevels: PriceLevel[],
  deltas: [string, string][],
  maxLevels: number
): PriceLevel[] {
  const levelMap = new Map<string, string>();

  // 加载现有档位
  currentLevels.forEach((level) => {
    levelMap.set(level.price, level.quantity);
  });

  // 应用增量
  deltas.forEach(([price, quantity]) => {
    if (parseFloat(quantity) === 0) {
      levelMap.delete(price);
    } else {
      levelMap.set(price, quantity);
    }
  });

  // 转换回数组并排序，限制为固定档位数量
  const levels: PriceLevel[] = Array.from(levelMap.entries()).map(
    ([price, quantity]) => ({ price, quantity })
  );

  return levels
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
    .slice(0, maxLevels);
}
