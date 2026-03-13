'use client';

import { useState, useCallback, useEffect } from 'react';
import { Maximize2 } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useDragResize } from '@/hooks/useDragResize';
import OrderBook from '@/components/OrderBook';
import { OrderBookSkeleton } from '@/components/OrderBook/Skeleton';
import TradeTape from '@/components/TradeTape';
import { TradeTapeSkeleton } from '@/components/TradeTape/Skeleton';
import OrderEntry from '@/components/OrderEntry';
import MarketSelector from '@/components/MarketSelector';
import ConnectionStatus from '@/components/ConnectionStatus';
import MessageRate from '@/components/MessageRate';
import Panel from '@/components/Panel';
import KLineChart from '@/components/KLineChart';
import MarketStats from '@/components/MarketStats';
import PositionPanel from '@/components/PositionPanel';
import { Button } from '@/components/ui/button';
import { useMarketStore } from '@/stores/marketStore';

// ── Types ──────────────────────────────────────────────────────────

type PanelId = 'kline' | 'orderbook' | 'trades' | 'order-entry';

const PANEL_LABELS: Record<PanelId, string> = {
  kline: 'K线图',
  orderbook: '盘口',
  trades: '成交记录',
  'order-entry': '下单',
};

// ── Resize handle ──────────────────────────────────────────────────

function ResizeHandle({
  axis,
  onMouseDown,
}: {
  axis: 'x' | 'y';
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`shrink-0 group ${axis === 'x' ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'} bg-gray-800 transition-colors hover:bg-blue-500/50`}
      onMouseDown={onMouseDown}
    />
  );
}

// ── Main page ──────────────────────────────────────────────────────

export default function Home() {
  const currentMarket = useMarketStore((s) => s.currentMarket);
  const connectionStatus = useMarketStore((s) => s.connectionStatus);
  const streamError = useMarketStore((s) => s.streamError);
  const requestRetry = useMarketStore((s) => s.requestRetry);
  const setStreamError = useMarketStore((s) => s.setStreamError);

  const isLoading = connectionStatus === 'connecting' || connectionStatus === 'reconnecting';

  useWebSocket(currentMarket.symbol);

  // Panel maximize state
  const [maximizedPanel, setMaximizedPanel] = useState<PanelId | null>(null);
  const [draggingPanel, setDraggingPanel] = useState<PanelId | null>(null);
  const [dropHovered, setDropHovered] = useState(false);

  // Resizable panel dimensions
  // obWidth: orderbook left column width
  const { size: obWidth, onMouseDown: onObResize } = useDragResize(210, 150, 340, 'x');
  // oeWidth: order-entry right column width (reversed: drag left = bigger)
  const { size: oeWidth, onMouseDown: onOeResize } = useDragResize(280, 220, 400, 'x', true);
  // tradesH: trade tape bottom section height (reversed: drag up = bigger)
  const { size: tradesH, onMouseDown: onTradesResize } = useDragResize(190, 100, 380, 'y', true);

  // ESC to restore
  useEffect(() => {
    if (!maximizedPanel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaximizedPanel(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [maximizedPanel]);

  // ── Drag-to-maximize handlers ──────────────────────────────────

  const handleDragStart = useCallback((id: string, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingPanel(id as PanelId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingPanel(null);
    setDropHovered(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') as PanelId;
    if (id) setMaximizedPanel(id);
    setDraggingPanel(null);
    setDropHovered(false);
  }, []);

  // ── Shared panel props factory ────────────────────────────────

  const panelProps = (id: PanelId) => ({
    id,
    title: PANEL_LABELS[id],
    isMaximized: maximizedPanel === id,
    onMaximize: (pid: string) => setMaximizedPanel(pid as PanelId),
    onRestore: () => setMaximizedPanel(null),
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  });

  // Render inner content for a given panel (used in both normal and maximized views)
  const renderContent = (id: PanelId) => {
    switch (id) {
      case 'kline':
        return <KLineChart symbol={currentMarket.symbol} />;
      case 'orderbook':
        return (
          <OrderBook
            pricePrecision={currentMarket.pricePrecision}
            quantityPrecision={currentMarket.quantityPrecision}
          />
        );
      case 'trades':
        return (
          <TradeTape
            pricePrecision={currentMarket.pricePrecision}
            quantityPrecision={currentMarket.quantityPrecision}
          />
        );
      case 'order-entry':
        return <OrderEntry />;
    }
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* ── Top nav ── */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800 shrink-0">
        <h1 className="text-sm font-semibold tracking-wide">Perpetual Trading</h1>
        <div className="flex items-center gap-3">
          <MarketSelector />
          <div className="w-px h-4 bg-gray-700" />
          <ConnectionStatus />
          <div className="w-px h-4 bg-gray-700" />
          <MessageRate />
        </div>
      </header>

      {/* ── Market stats bar ── */}
      <MarketStats />

      {/* ── Error banner ── */}
      {streamError && (
        <div className="px-4 py-2 border-b border-red-800 bg-red-950/40 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-red-300">{streamError}</p>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setStreamError(null); requestRetry(); }}
              className="h-7 px-2 text-xs border-red-700 text-red-200 hover:bg-red-900/40 hover:text-red-100"
            >
              重试
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStreamError(null)}
              className="h-7 px-2 text-xs text-gray-300 hover:bg-gray-800"
            >
              关闭
            </Button>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 min-h-0 flex flex-col">

        {/* ── Panel grid ── */}
        <div className="flex-1 min-h-0 flex relative">

          {/* Maximized panel — full overlay */}
          {maximizedPanel && (
            <div className="absolute inset-0 z-30 flex">
              <Panel
                {...panelProps(maximizedPanel)}
                isLoading={isLoading && (maximizedPanel === 'orderbook' || maximizedPanel === 'trades')}
                skeleton={maximizedPanel === 'orderbook' ? <OrderBookSkeleton /> : <TradeTapeSkeleton />}
                className="flex-1"
              >
                {renderContent(maximizedPanel)}
              </Panel>
            </div>
          )}

          {/* Drag-to-maximize drop zone — shown while dragging */}
          {draggingPanel && !maximizedPanel && (
            <div
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onDragOver={(e) => e.preventDefault()}
            >
              <div
                className={`flex flex-col items-center justify-center gap-3 w-60 h-36 rounded-2xl border-2 border-dashed transition-all duration-150 ${
                  dropHovered
                    ? 'border-blue-400 bg-blue-500/20 scale-105'
                    : 'border-gray-600 bg-gray-900/60'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDropHovered(true); }}
                onDragLeave={() => setDropHovered(false)}
                onDrop={handleDrop}
              >
                <Maximize2
                  className={`w-7 h-7 transition-colors ${dropHovered ? 'text-blue-400' : 'text-gray-500'}`}
                />
                <span className={`text-xs transition-colors ${dropHovered ? 'text-blue-300' : 'text-gray-500'}`}>
                  {dropHovered ? '释放以最大化' : '拖入此处最大化'}
                </span>
              </div>
            </div>
          )}

          {/* ── Left column: Order Book ── */}
          <div className="flex flex-col border-r border-gray-800" style={{ width: obWidth }}>
            <Panel
              {...panelProps('orderbook')}
              isLoading={isLoading}
              skeleton={<OrderBookSkeleton />}
              className="flex-1"
            >
              <OrderBook
                pricePrecision={currentMarket.pricePrecision}
                quantityPrecision={currentMarket.quantityPrecision}
              />
            </Panel>
          </div>

          <ResizeHandle axis="x" onMouseDown={onObResize} />

          {/* ── Center column: KLine (top) + Trades (bottom) ── */}
          <div className="flex-1 min-w-0 flex flex-col">
            <Panel {...panelProps('kline')} className="flex-1 min-h-0">
              <KLineChart symbol={currentMarket.symbol} />
            </Panel>

            <ResizeHandle axis="y" onMouseDown={onTradesResize} />

            <div className="shrink-0" style={{ height: tradesH }}>
              <Panel
                {...panelProps('trades')}
                isLoading={isLoading}
                skeleton={<TradeTapeSkeleton />}
                className="h-full"
              >
                <TradeTape
                  pricePrecision={currentMarket.pricePrecision}
                  quantityPrecision={currentMarket.quantityPrecision}
                />
              </Panel>
            </div>
          </div>

          <ResizeHandle axis="x" onMouseDown={onOeResize} />

          {/* ── Right column: Order Entry ── */}
          <div className="flex flex-col border-l border-gray-800" style={{ width: oeWidth }}>
            <Panel {...panelProps('order-entry')} className="h-full">
              <OrderEntry />
            </Panel>
          </div>
        </div>

        {/* ── Bottom: Position / Orders / History ── */}
        <div className="h-52 shrink-0 border-t border-gray-800">
          <PositionPanel />
        </div>
      </div>
    </div>
  );
}
