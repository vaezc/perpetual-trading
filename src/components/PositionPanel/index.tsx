'use client';

import { useState } from 'react';
import { usePositionStore } from '@/stores/positionStore';
import { useMarketStore } from '@/stores/marketStore';

type PanelTab = 'positions' | 'orders' | 'history';

// ── 持仓表格 ───────────────────────────────────────────────

function PositionsTable() {
  const positions = usePositionStore((s) => s.positions);
  const closePosition = usePositionStore((s) => s.closePosition);
  const markPriceStr = useMarketStore((s) => s.stats.lastPrice);
  const markPrice = parseFloat(markPriceStr) || 0;

  if (positions.length === 0) {
    return <EmptyState text="暂无持仓" />;
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500 border-b border-gray-800">
          {['合约', '方向', '数量', '开仓均价', '标记价格', '未实现盈亏', '收益率', '强平价格', '操作'].map((h) => (
            <th key={h} className="px-3 py-2 text-left font-normal whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {positions.map((pos) => {
          const mp = markPrice || pos.entryPrice;
          const pnl = pos.side === 'long'
            ? (mp - pos.entryPrice) * pos.size
            : (pos.entryPrice - mp) * pos.size;
          const margin = (pos.entryPrice * pos.size) / pos.leverage;
          const roe = margin > 0 ? (pnl / margin) * 100 : 0;
          const liqPrice = pos.side === 'long'
            ? pos.entryPrice * (1 - 1 / pos.leverage + 0.004)
            : pos.entryPrice * (1 + 1 / pos.leverage - 0.004);
          const pnlColor = pnl >= 0 ? 'text-[#0ecb81]' : 'text-[#ef5350]';

          return (
            <tr key={pos.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
              <td className="px-3 py-2 text-gray-200 whitespace-nowrap">{pos.symbol}</td>
              <td className={`px-3 py-2 font-medium whitespace-nowrap ${pos.side === 'long' ? 'text-[#0ecb81]' : 'text-[#ef5350]'}`}>
                {pos.side === 'long' ? '多' : '空'} {pos.leverage}x
              </td>
              <td className="px-3 py-2 text-gray-200">{pos.size}</td>
              <td className="px-3 py-2 text-gray-200">{pos.entryPrice.toFixed(2)}</td>
              <td className="px-3 py-2 text-gray-200">{mp > 0 ? mp.toFixed(2) : '--'}</td>
              <td className={`px-3 py-2 font-medium ${pnlColor}`}>{pnl.toFixed(2)}</td>
              <td className={`px-3 py-2 ${pnlColor}`}>{roe.toFixed(2)}%</td>
              <td className="px-3 py-2 text-gray-400">{liqPrice.toFixed(2)}</td>
              <td className="px-3 py-2">
                <button
                  onClick={() => closePosition(pos.id)}
                  className="px-2 py-0.5 rounded text-xs bg-gray-700 hover:bg-red-900/60 hover:text-red-300 text-gray-300 transition-colors whitespace-nowrap"
                >
                  市价平仓
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── 委托表格 ───────────────────────────────────────────────

function OrdersTable() {
  const orders = usePositionStore((s) => s.orders);
  const cancelOrder = usePositionStore((s) => s.cancelOrder);

  if (orders.length === 0) {
    return <EmptyState text="暂无委托" />;
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500 border-b border-gray-800">
          {['时间', '合约', '方向', '类型', '委托价', '委托量', '已成交', '状态', '操作'].map((h) => (
            <th key={h} className="px-3 py-2 text-left font-normal whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
            <td className="px-3 py-2 text-gray-400 font-mono whitespace-nowrap">{o.time}</td>
            <td className="px-3 py-2 text-gray-200 whitespace-nowrap">{o.symbol}</td>
            <td className={`px-3 py-2 font-medium ${o.side === 'buy' ? 'text-[#0ecb81]' : 'text-[#ef5350]'}`}>
              {o.side === 'buy' ? '买入' : '卖出'}
            </td>
            <td className="px-3 py-2 text-gray-400">{o.type === 'limit' ? '限价' : '市价'}</td>
            <td className="px-3 py-2 text-gray-200">{o.type === 'market' ? '市价' : o.price.toFixed(2)}</td>
            <td className="px-3 py-2 text-gray-200">{o.quantity}</td>
            <td className="px-3 py-2 text-gray-400">{o.filled}</td>
            <td className="px-3 py-2 text-gray-400">{o.status}</td>
            <td className="px-3 py-2">
              <button
                onClick={() => cancelOrder(o.id)}
                className="px-2 py-0.5 rounded text-xs bg-gray-700 hover:bg-orange-900/60 hover:text-orange-300 text-gray-300 transition-colors"
              >
                撤单
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── 历史成交表格 ────────────────────────────────────────────

function HistoryTable() {
  const history = usePositionStore((s) => s.history);

  if (history.length === 0) {
    return <EmptyState text="暂无记录" />;
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-500 border-b border-gray-800">
          {['时间', '合约', '方向', '成交价', '成交量', '手续费', '实现盈亏'].map((h) => (
            <th key={h} className="px-3 py-2 text-left font-normal whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {history.map((t) => {
          const pnlColor = t.realizedPnl > 0 ? 'text-[#0ecb81]' : t.realizedPnl < 0 ? 'text-[#ef5350]' : 'text-gray-400';
          return (
            <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
              <td className="px-3 py-2 text-gray-400 font-mono whitespace-nowrap">{t.time}</td>
              <td className="px-3 py-2 text-gray-200 whitespace-nowrap">{t.symbol}</td>
              <td className={`px-3 py-2 font-medium ${t.side === 'buy' ? 'text-[#0ecb81]' : 'text-[#ef5350]'}`}>
                {t.side === 'buy' ? '买入' : '卖出'}
              </td>
              <td className="px-3 py-2 text-gray-200">{t.price.toFixed(2)}</td>
              <td className="px-3 py-2 text-gray-200">{t.quantity}</td>
              <td className="px-3 py-2 text-gray-400">{t.fee.toFixed(4)}</td>
              <td className={`px-3 py-2 font-medium ${pnlColor}`}>
                {t.realizedPnl === 0 ? '--' : (t.realizedPnl > 0 ? '+' : '') + t.realizedPnl.toFixed(2)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── 空状态 ─────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-24 text-xs text-gray-600">{text}</div>
  );
}

// ── 主组件 ─────────────────────────────────────────────────

export default function PositionPanel() {
  const [activeTab, setActiveTab] = useState<PanelTab>('positions');
  const posCount = usePositionStore((s) => s.positions.length);
  const ordCount = usePositionStore((s) => s.orders.length);

  const tabs: { key: PanelTab; label: string; count?: number }[] = [
    { key: 'positions', label: '当前持仓', count: posCount },
    { key: 'orders',    label: '当前委托', count: ordCount },
    { key: 'history',   label: '历史成交' },
  ];

  return (
    <div className="flex flex-col bg-gray-900 border-t border-gray-800 h-full">
      {/* Tab 标题栏 */}
      <div className="flex items-center border-b border-gray-800 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs transition-colors relative whitespace-nowrap ${
              activeTab === tab.key
                ? 'text-white font-medium'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 text-gray-500">({tab.count})</span>
            )}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* 内容区（可滚动）*/}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'positions' && <PositionsTable />}
        {activeTab === 'orders'    && <OrdersTable />}
        {activeTab === 'history'   && <HistoryTable />}
      </div>
    </div>
  );
}
