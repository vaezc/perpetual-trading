/**
 * Trade Store - Zustand state management
 * 交易记录状态管理
 */

import { create } from 'zustand';
import { Trade } from '@/types/trade';

interface TradeState {
  trades: Trade[];
  addTrade: (data: any) => void;
  reset: () => void;
}

const MAX_TRADES = 100; // 最多保留100条交易记录

export const useTradeStore = create<TradeState>((set) => ({
  trades: [],

  /**
   * Add new trade from WebSocket data
   * 从 WebSocket 数据添加新交易
   */
  addTrade: (data: any) => {
    set((state) => {
      // 币安 trade 格式 / Binance trade format
      const trade: Trade = {
        id: data.t.toString(),
        price: data.p,
        quantity: data.q,
        timestamp: data.T,
        isBuyerMaker: data.m,
      };

      // 添加到列表开头，保持最新的在前 / Add to front, keep newest first
      const newTrades = [trade, ...state.trades].slice(0, MAX_TRADES);

      return { trades: newTrades };
    });
  },

  reset: () => set({ trades: [] }),
}));
