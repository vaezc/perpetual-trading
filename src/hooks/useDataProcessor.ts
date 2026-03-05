/**
 * useDataProcessor Hook - Use Web Worker for data processing
 * 数据处理 Hook - 使用 Web Worker 处理数据
 */

import { useEffect, useRef, useState } from "react";
import { wrap, Remote } from "comlink";
import type {
  BinanceOrderBookData,
  BinanceTradeData,
  ProcessedTrade,
  ProcessedOrderBook,
} from "@/types/worker";

type DataProcessor = {
  reset: () => Promise<void>;
  processOrderBook: (
    data: BinanceOrderBookData,
  ) => Promise<ProcessedOrderBook | null>;
  addTrade: (data: BinanceTradeData) => Promise<ProcessedTrade[] | null>;
};

export function useDataProcessor() {
  const workerRef = useRef<Worker | null>(null);
  const [processor, setProcessor] = useState<Remote<DataProcessor> | null>(
    null,
  );

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/dataProcessor.worker.ts", import.meta.url),
      { type: "module" },
    );
    const wrapped = wrap<DataProcessor>(workerRef.current);
    // Comlink proxy 的 typeof 是 'function'，需要用函数形式避免 React 将其当作 updater 调用
    setProcessor(() => wrapped);

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return processor;
}
