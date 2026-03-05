/**
 * Market Store - Zustand state management
 * 市场状态管理
 */

import { create } from 'zustand';
import { MarketInfo, ConnectionStatus, MarketStats } from '@/types/market';

interface MarketState {
  currentMarket: MarketInfo;
  connectionStatus: ConnectionStatus;
  stats: MarketStats;
  streamError: string | null;
  retryNonce: number;
  setMarket: (market: MarketInfo) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  updateStats: (stats: Partial<MarketStats>) => void;
  setStreamError: (message: string | null) => void;
  requestRetry: () => void;
}

const defaultMarket: MarketInfo = {
  symbol: 'BTCUSDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  pricePrecision: 2,
  quantityPrecision: 6,
};

const defaultStats: MarketStats = {
  messageRate: 0,
  lastPrice: '0',
  priceChange24h: 0,
  volume24h: '0',
};

export const useMarketStore = create<MarketState>((set) => ({
  currentMarket: defaultMarket,
  connectionStatus: 'disconnected',
  stats: defaultStats,
  streamError: null,
  retryNonce: 0,

  setMarket: (market) => set({ currentMarket: market }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  updateStats: (stats) =>
    set((state) => ({
      stats: { ...state.stats, ...stats }
    })),

  setStreamError: (message) => set({ streamError: message }),

  requestRetry: () =>
    set((state) => ({
      retryNonce: state.retryNonce + 1,
    })),
}));
