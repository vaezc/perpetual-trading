/**
 * Trade Store - Zustand state management
 * 交易记录状态管理
 */

import { create } from "zustand";
import { Trade } from "@/types/trade";

interface TradeState {
  trades: Trade[];
  addTrades: (dataArray: any[]) => void;
  reset: () => void;
}

const MAX_TRADES = 50; // 最多保留50条交易记录

export const useTradeStore = create<TradeState>((set) => ({
  trades: [],

  /**
   * Add multiple trades in batch (for performance)
   * 批量添加交易（性能优化）
   */
  addTrades: (dataArray: any[]) => {
    set((state) => {
      const newTrades = dataArray.map((data) => ({
        id: data.t.toString(),
        price: data.p,
        quantity: data.q,
        timestamp: data.T,
        isBuyerMaker: data.m,
      }));

      return {
        trades: [...newTrades, ...state.trades].slice(0, MAX_TRADES),
      };
    });
  },

  reset: () => set({ trades: [] }),
}));
