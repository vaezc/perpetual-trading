import { create } from 'zustand';
import { formatTime } from '@/lib/utils';

export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  leverage: number;
}

export interface Order {
  id: string;
  time: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price: number;
  quantity: number;
  filled: number;
  status: string;
}

export interface HistoryTrade {
  id: string;
  time: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  fee: number;
  realizedPnl: number;
}

interface PositionState {
  positions: Position[];
  orders: Order[];
  history: HistoryTrade[];
  closePosition: (id: string) => void;
  cancelOrder: (id: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'time'>) => void;
}

const MOCK_POSITIONS: Position[] = [
  {
    id: 'pos-1',
    symbol: 'BTCUSDT',
    side: 'long',
    size: 0.05,
    entryPrice: 71200.0,
    leverage: 10,
  },
];

const MOCK_HISTORY: HistoryTrade[] = [
  { id: 'h-1', time: '10:22:05', symbol: 'BTCUSDT', side: 'buy',  price: 70500.0, quantity: 0.02, fee: 0.71, realizedPnl: 0 },
  { id: 'h-2', time: '11:48:33', symbol: 'ETHUSDT', side: 'sell', price: 3820.5,  quantity: 0.5,  fee: 0.96, realizedPnl: 45.25 },
  { id: 'h-3', time: '13:15:11', symbol: 'BTCUSDT', side: 'sell', price: 71100.0, quantity: 0.03, fee: 1.07, realizedPnl: -18.0 },
  { id: 'h-4', time: '14:02:47', symbol: 'BNBUSDT', side: 'buy',  price: 605.2,   quantity: 1.0,  fee: 0.30, realizedPnl: 0 },
];

export const usePositionStore = create<PositionState>((set) => ({
  positions: MOCK_POSITIONS,
  orders: [],
  history: MOCK_HISTORY,

  closePosition: (id) =>
    set((state) => ({ positions: state.positions.filter((p) => p.id !== id) })),

  cancelOrder: (id) =>
    set((state) => ({ orders: state.orders.filter((o) => o.id !== id) })),

  addOrder: (order) =>
    set((state) => ({
      orders: [
        {
          ...order,
          id: `ord-${Date.now()}`,
          time: formatTime(Date.now()),
        },
        ...state.orders,
      ],
    })),
}));
