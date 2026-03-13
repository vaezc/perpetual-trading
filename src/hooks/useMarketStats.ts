'use client';

import { useEffect, useRef, useState } from 'react';

// 重命名接口避免与组件 MarketStats 同名
export interface MarketStatsData {
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  fundingRate: string;
  countdown: string;
}

const DEFAULT_STATS: MarketStatsData = {
  lastPrice: '--',
  priceChangePercent: '0',
  highPrice: '--',
  lowPrice: '--',
  volume: '--',
  fundingRate: '--',
  countdown: '--:--:--',
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useMarketStats(symbol: string): MarketStatsData {
  const [stats, setStats] = useState<MarketStatsData>(DEFAULT_STATS);
  // 用 ref 存储 nextFundingTime，避免写入 state（countdown interval 只需要 ref）
  const nextFundingTimeRef = useRef<number>(0);

  // 每秒更新倒计时，同值时跳过 setState 避免无效重渲染
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = nextFundingTimeRef.current - Date.now();
      const newCountdown = formatCountdown(remaining);
      setStats((prev) => {
        if (prev.countdown === newCountdown) return prev;
        return { ...prev, countdown: newCountdown };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 轮询 24h 行情（每 5 秒）
  useEffect(() => {
    let cancelled = false;

    async function fetch24h() {
      try {
        const res = await fetch(
          `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`
        );
        const data = await res.json();
        if (cancelled) return;
        setStats((prev) => ({
          ...prev,
          lastPrice: parseFloat(data.lastPrice).toFixed(2),
          priceChangePercent: data.priceChangePercent,
          highPrice: parseFloat(data.highPrice).toFixed(2),
          lowPrice: parseFloat(data.lowPrice).toFixed(2),
          volume: parseFloat(data.volume).toFixed(2),
        }));
      } catch {
        // 国内网络可能超时，静默失败
      }
    }

    fetch24h();
    const interval = setInterval(fetch24h, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [symbol]);

  // 轮询资金费率（每 30 秒）
  useEffect(() => {
    let cancelled = false;

    async function fetchFunding() {
      try {
        const res = await fetch(
          `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`
        );
        const data = await res.json();
        if (cancelled) return;
        const rate = (parseFloat(data.lastFundingRate) * 100).toFixed(4);
        nextFundingTimeRef.current = data.nextFundingTime;
        setStats((prev) => ({ ...prev, fundingRate: rate }));
      } catch {
        // 静默失败
      }
    }

    fetchFunding();
    const interval = setInterval(fetchFunding, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [symbol]);

  return stats;
}
