/**
 * Utility functions
 * 工具函数库
 */

import { debounce, throttle } from "lodash";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import BigNumber from "bignumber.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// 配置 dayjs 插件 / Configure dayjs plugins
dayjs.extend(relativeTime);

// ==================== Tailwind CSS 工具 / Tailwind CSS Utils ====================

/**
 * Merge Tailwind CSS classes
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== 数字精度处理 / Number Precision ====================

/**
 * Configure BigNumber global settings
 * 配置 BigNumber 全局设置
 */
BigNumber.config({
  EXPONENTIAL_AT: [-20, 20], // 避免科学计数法
  DECIMAL_PLACES: 18, // 默认小数位数
  ROUNDING_MODE: BigNumber.ROUND_DOWN, // 向下取整
});

/**
 * Create a BigNumber instance
 * 创建 BigNumber 实例
 */
export function toBigNumber(value: number | string): BigNumber {
  return new BigNumber(value);
}

/**
 * Format number with specified decimal places using BigNumber
 * 使用 BigNumber 格式化数字到指定小数位数
 */
export function formatNumber(
  num: number | string,
  decimals: number = 2,
): string {
  return new BigNumber(num).toFixed(decimals);
}

/**
 * Format price with appropriate precision
 * 格式化价格（带精度）
 */
export function formatPrice(
  price: number | string,
  precision: number = 2,
): string {
  return new BigNumber(price).toFixed(precision);
}

/**
 * Format quantity with appropriate precision
 * 格式化数量（带精度）
 */
export function formatQuantity(
  quantity: number | string,
  precision: number = 4,
): string {
  return new BigNumber(quantity).toFixed(precision);
}

/**
 * Safe addition with BigNumber
 * 安全的加法运算
 */
export function add(a: number | string, b: number | string): string {
  return new BigNumber(a).plus(b).toString();
}

/**
 * Safe subtraction with BigNumber
 * 安全的减法运算
 */
export function subtract(a: number | string, b: number | string): string {
  return new BigNumber(a).minus(b).toString();
}

/**
 * Safe multiplication with BigNumber
 * 安全的乘法运算
 */
export function multiply(a: number | string, b: number | string): string {
  return new BigNumber(a).multipliedBy(b).toString();
}

/**
 * Safe division with BigNumber
 * 安全的除法运算
 */
export function divide(a: number | string, b: number | string): string {
  return new BigNumber(a).dividedBy(b).toString();
}

/**
 * Calculate percentage change with BigNumber
 * 使用 BigNumber 计算百分比变化
 * @param current - 当前值
 * @param previous - 之前的值
 * @returns 百分比变化（如 5.5 表示增长 5.5%）
 */
export function calculatePercentageChange(
  current: number | string,
  previous: number | string,
): number {
  const prev = new BigNumber(previous);
  if (prev.isZero()) return 0;

  const curr = new BigNumber(current);
  return curr.minus(prev).dividedBy(prev).multipliedBy(100).toNumber();
}

// ==================== 时间处理 / Time Formatting ====================

/**
 * Format timestamp to readable time (HH:mm:ss)
 * 格式化时间戳为可读时间（时:分:秒）
 */
export function formatTime(timestamp: number): string {
  return dayjs(timestamp).format("HH:mm:ss");
}

/**
 * Format timestamp to date and time
 * 格式化时间戳为日期和时间
 */
export function formatDateTime(timestamp: number): string {
  return dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss");
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * 格式化为相对时间（如 "2小时前"）
 */
export function formatRelativeTime(timestamp: number): string {
  return dayjs(timestamp).fromNow();
}

/**
 * Get current timestamp
 * 获取当前时间戳
 */
export function getCurrentTimestamp(): number {
  return dayjs().valueOf();
}

// ==================== 防抖和节流 / Debounce & Throttle ====================

/**
 * Export lodash debounce
 * 导出 lodash 防抖函数
 *
 * 用法 / Usage:
 * const debouncedFn = debounce(() => { ... }, 300);
 */
export { debounce };

/**
 * Export lodash throttle
 * 导出 lodash 节流函数
 *
 * 用法 / Usage:
 * const throttledFn = throttle(() => { ... }, 1000);
 */
export { throttle };

/**
 * Group updates in a batch and execute with requestAnimationFrame
 * 批量更新 - 将多个更新收集后在下一帧一次性执行（性能优化关键）
 *
 * 使用场景：高频 WebSocket 消息处理
 * - 避免每条消息都触发重渲染
 * - 将同一帧内的多个更新合并处理
 *
 * @param callback - 批量处理函数
 * @returns 单项处理函数
 *
 * @example
 * const batchedUpdate = batchUpdates((items) => {
 *   updateOrderBook(items); // 批量更新订单簿
 * });
 *
 * // 高频调用，但实际每帧只执行一次
 * ws.onmessage = (msg) => batchedUpdate(msg.data);
 */
export function batchUpdates<T>(
  callback: (items: T[]) => void,
): (item: T) => void {
  let pending: T[] = [];
  let rafId: number | null = null;

  return (item: T) => {
    pending.push(item);

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        callback(pending);
        pending = [];
        rafId = null;
      });
    }
  };
}
