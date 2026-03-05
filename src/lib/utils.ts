/**
 * Utility functions
 * 工具函数库
 */

import dayjs from "dayjs";
import BigNumber from "bignumber.js";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
 * Configure BigNumber to avoid scientific notation in display
 * 配置 BigNumber 避免科学计数法显示
 */
BigNumber.config({
  EXPONENTIAL_AT: [-20, 20],
  DECIMAL_PLACES: 18,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
});

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

// ==================== 时间处理 / Time Formatting ====================

/**
 * Format timestamp to readable time (HH:mm:ss)
 * 格式化时间戳为可读时间（时:分:秒）
 */
export function formatTime(timestamp: number): string {
  return dayjs(timestamp).format("HH:mm:ss");
}
