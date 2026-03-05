/**
 * Trade Store - Zustand state management
 * 交易记录状态管理
 */

import { create } from "zustand";
import { Trade } from "@/types/trade";

interface TradeState {
  trades: Trade[];
  addTrades: (trades: Trade[]) => void;
  reset: () => void;
}

const MAX_TRADES = 50; // 最多保留50条交易记录

export const useTradeStore = create<TradeState>((set) => ({
  trades: [],

  /**
   * Add multiple trades in batch (already processed by worker)
   * 批量添加交易（已由 worker 处理）
   */
  addTrades: (trades: Trade[]) => {
    set((state) => ({
      trades: [...trades, ...state.trades].slice(0, MAX_TRADES),
    }));
  },

  reset: () => set({ trades: [] }),
}));
