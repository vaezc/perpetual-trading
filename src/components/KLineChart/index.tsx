'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  Time,
  LogicalRangeChangeEventHandler,
} from 'lightweight-charts';
import { SMA } from 'technicalindicators';

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
type Interval = typeof INTERVALS[number];

interface KLineChartProps {
  symbol?: string;
}

// MA 计算公共函数，避免 MA5/MA20 重复逻辑
function buildMAData(closes: number[], candles: CandlestickData[], period: number): LineData[] {
  const values = SMA.calculate({ period, values: closes });
  return values.map((value, i) => ({ time: candles[i + period - 1].time, value }));
}

export default function KLineChart({ symbol = 'BTCUSDT' }: KLineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ma5SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 全量 K 线缓存
  const candlesRef = useRef<CandlestickData[]>([]);
  // 与 candlesRef 索引一一对应的成交量缓存（替代 rawDataRef，避免同步问题）
  const volumesRef = useRef<number[]>([]);
  // 最早 K 线时间戳（秒），用于懒加载 endTime
  const oldestTimeRef = useRef<number | null>(null);
  const isLoadingMoreRef = useRef(false);

  // 重命名避免遮盖全局 window.setInterval
  const [interval, setCurrentInterval] = useState<Interval>('1m');

  // ── 工具函数 ──────────────────────────────────────────────

  function rebuildMA(candles: CandlestickData[]) {
    const closes = candles.map((c) => c.close);
    ma5SeriesRef.current?.setData(buildMAData(closes, candles, 5));
    ma20SeriesRef.current?.setData(buildMAData(closes, candles, 20));
  }

  function rebuildVolume(candles: CandlestickData[], volumes: number[]) {
    const volumeData: HistogramData[] = candles.map((c, i) => ({
      time: c.time,
      value: volumes[i],
      color: c.close >= c.open ? '#0ecb81' : '#ef5350',
    }));
    volumeSeriesRef.current?.setData(volumeData);
  }

  // ── 初始化图表（只跑一次）────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: '#0f1117' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      rightPriceScale: { borderColor: '#374151' },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: '#4b5563' },
        horzLine: { color: '#4b5563' },
      },
    });

    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#ef5350',
      borderUpColor: '#0ecb81',
      borderDownColor: '#ef5350',
      wickUpColor: '#0ecb81',
      wickDownColor: '#ef5350',
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    ma5SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#F6C90E',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    ma20SeriesRef.current = chart.addSeries(LineSeries, {
      color: '#3BAFDA',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      ma5SeriesRef.current = null;
      ma20SeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // ── symbol / interval 变化时重载数据 ─────────────────────

  useEffect(() => {
    if (!candleSeriesRef.current || !chartRef.current) return;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // 重置状态
    candlesRef.current = [];
    volumesRef.current = [];
    oldestTimeRef.current = null;
    isLoadingMoreRef.current = false;

    const sym = symbol.toUpperCase();
    const symLower = symbol.toLowerCase();

    // 组件卸载或 effect 重跑时取消进行中的异步操作
    let isCancelled = false;

    async function loadMoreHistory() {
      if (!oldestTimeRef.current || isLoadingMoreRef.current) return;
      isLoadingMoreRef.current = true;
      try {
        const endTime = oldestTimeRef.current * 1000;
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${interval}&limit=200&endTime=${endTime}`
        );
        const raw: unknown[][] = await res.json();

        if (isCancelled) return;

        // 去掉最后一根（与现有数据重叠）
        const trimmed = raw.slice(0, -1);
        if (trimmed.length === 0) return;

        const newCandles: CandlestickData[] = trimmed.map((item) => ({
          time: ((item[0] as number) / 1000) as Time,
          open: parseFloat(item[1] as string),
          high: parseFloat(item[2] as string),
          low: parseFloat(item[3] as string),
          close: parseFloat(item[4] as string),
        }));
        const newVolumes = trimmed.map((item) => parseFloat(item[5] as string));

        oldestTimeRef.current = newCandles[0].time as number;

        const merged = [...newCandles, ...candlesRef.current];
        const mergedVolumes = [...newVolumes, ...volumesRef.current];
        candlesRef.current = merged;
        volumesRef.current = mergedVolumes;

        candleSeriesRef.current?.setData(merged);
        rebuildMA(merged);
        rebuildVolume(merged, mergedVolumes);
      } catch (e) {
        if (!isCancelled) console.error(e);
      } finally {
        if (!isCancelled) isLoadingMoreRef.current = false;
      }
    }

    // ── 拉取初始 200 根历史数据 ───────────────────────────
    fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${interval}&limit=200`)
      .then((res) => res.json())
      .then((data: unknown[][]) => {
        if (isCancelled || !candleSeriesRef.current) return;

        const candles: CandlestickData[] = data.map((item) => ({
          time: ((item[0] as number) / 1000) as Time,
          open: parseFloat(item[1] as string),
          high: parseFloat(item[2] as string),
          low: parseFloat(item[3] as string),
          close: parseFloat(item[4] as string),
        }));
        const volumes = data.map((item) => parseFloat(item[5] as string));

        candlesRef.current = candles;
        volumesRef.current = volumes;
        oldestTimeRef.current = candles[0].time as number;

        candleSeriesRef.current.setData(candles);
        rebuildMA(candles);
        rebuildVolume(candles, volumes);
        chartRef.current?.timeScale().fitContent();
      })
      .catch((e) => { if (!isCancelled) console.error(e); });

    // ── 向左滚动懒加载监听 ────────────────────────────────
    const handleRangeChange: LogicalRangeChangeEventHandler = (range) => {
      if (!range) return;
      if (range.from < 10 && !isLoadingMoreRef.current && oldestTimeRef.current) {
        loadMoreHistory();
      }
    };
    chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);

    // ── WebSocket 实时推送 ────────────────────────────────
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symLower}@kline_${interval}`
    );
    wsRef.current = ws;

    ws.onmessage = (event) => {
      if (isCancelled || !candleSeriesRef.current) return;
      const { k } = JSON.parse(event.data);
      const candle: CandlestickData = {
        time: ((k.t as number) / 1000) as Time,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
      };
      const volume = parseFloat(k.v);

      candleSeriesRef.current.update(candle);

      // 同步更新 candlesRef 和 volumesRef（保持两者索引一致）
      const cache = candlesRef.current;
      if (cache.length > 0 && cache[cache.length - 1].time === candle.time) {
        cache[cache.length - 1] = candle;
        volumesRef.current[volumesRef.current.length - 1] = volume;
      } else {
        cache.push(candle);
        volumesRef.current.push(volume);
      }

      // 实时 MA5
      if (cache.length >= 5) {
        const val = cache.slice(-5).reduce((s, c) => s + c.close, 0) / 5;
        ma5SeriesRef.current?.update({ time: candle.time, value: val });
      }

      // 实时 MA20
      if (cache.length >= 20) {
        const val = cache.slice(-20).reduce((s, c) => s + c.close, 0) / 20;
        ma20SeriesRef.current?.update({ time: candle.time, value: val });
      }

      // 实时成交量
      volumeSeriesRef.current?.update({
        time: candle.time,
        value: volume,
        color: candle.close >= candle.open ? '#0ecb81' : '#ef5350',
      });
    };

    return () => {
      isCancelled = true;
      ws.close();
      wsRef.current = null;
      chartRef.current?.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, interval]);

  return (
    <div className="flex flex-col h-full">
      {/* 周期切换 + 均线图例 */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setCurrentInterval(iv)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                interval === iv
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {iv}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 ml-2">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <span className="inline-block w-4 h-0.5 bg-[#F6C90E]" />
            MA5
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <span className="inline-block w-4 h-0.5 bg-[#3BAFDA]" />
            MA20
          </span>
        </div>
      </div>
      {/* 图表容器 */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
