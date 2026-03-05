/**
 * useDataProcessor Hook - Use Web Worker for data processing
 * 数据处理 Hook - 使用 Web Worker 处理数据
 */

import { useEffect, useRef } from "react";
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
  const processorRef = useRef<Remote<DataProcessor> | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/dataProcessor.worker.ts", import.meta.url),
      { type: "module" },
    );
    processorRef.current = wrap<DataProcessor>(workerRef.current);

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return processorRef.current;
}
