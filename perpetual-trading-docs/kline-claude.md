# 任务：在现有 Orderbook 项目中新增 K 线图表

## 背景

当前项目已有：

- WebSocket 实时 Orderbook 渲染
- 增量 delta 合并逻辑

本次任务：新增一个 K 线图表组件，接入 Binance 公开 WebSocket，不需要 API Key。

---

## 安装依赖

```bash
npm install lightweight-charts technicalindicators
npm install -D @types/technicalindicators
```

---

## 任务拆解

### 1. 新建 K 线图表组件

新建文件 `components/KLineChart.tsx`，要求：

- 使用 `lightweight-charts` 库创建图表
- 图表容器用 `useRef` 挂载，组件卸载时销毁图表实例（`chart.remove()`）
- 支持传入 `symbol` prop，默认值为 `"BTCUSDT"`
- 组件内部管理 WebSocket 连接生命周期，组件卸载时关闭 ws

图表配置要求：

- 深色主题背景（`#0f1117`），与交易所 UI 风格一致
- 显示蜡烛图（CandlestickSeries）
- 图表自适应容器宽度（`autoSize: true`）
- 右侧价格轴保留 2 位小数

### 2. 数据来源：两个 Binance 公开接口

**① REST API — 获取历史 K 线（初始化用）**

```
GET https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=200
```

返回数组，每条数据格式：

```
[
  1499040000000,  // [0] 开盘时间 (ms)
  "0.01634790",   // [1] open
  "0.80000000",   // [2] high
  "0.01575800",   // [3] low
  "0.01577100",   // [4] close
  ...
]
```

转换为 lightweight-charts 格式：

```ts
{
  time: item[0] / 1000,  // 秒级时间戳
  open: parseFloat(item[1]),
  high: parseFloat(item[2]),
  low: parseFloat(item[3]),
  close: parseFloat(item[4]),
}
```

**② WebSocket — 实时 K 线推送**

```
wss://stream.binance.com:9443/ws/btcusdt@kline_1m
```

收到消息格式：

```json
{
  "k": {
    "t": 1499040000000, // 开盘时间 (ms)
    "o": "0.01634790", // open
    "h": "0.80000000", // high
    "l": "0.01575800", // low
    "c": "0.01577100", // close
    "x": false // 是否是这根 K 线的最后一条（收盘）
  }
}
```

处理逻辑：每次收到消息，调用 `series.update()` 更新当前这根 K 线，无论 `x` 是 true 还是 false 都更新（实现实时跳动效果）。

### 3. 周期切换

支持切换以下周期：`1m` `5m` `15m` `1h` `4h` `1d`

切换周期时：

- 关闭当前 WebSocket
- 重新请求 REST 历史数据
- 重新建立对应周期的 WebSocket 连接
- 清空并重新设置图表数据（`series.setData()`）

UI：在图表上方渲染周期选择按钮组，当前选中项高亮。

### 4. 均线叠加（MA5 / MA20）

使用 `technicalindicators` 计算 MA，结果用 `LineSeries` 叠加在主图上。

```ts
import { SMA } from "technicalindicators";

// closes 是所有历史 K 线的收盘价数组
function calcMA(closes: number[], period: number) {
  const result = SMA.calculate({ period, values: closes });
  // result 长度比 closes 短 (period - 1) 条，需要对齐时间戳
  return result;
}
```

时间对齐逻辑：MA 计算结果从第 `period - 1` 根 K 线开始有值，用 `candles.slice(period - 1)` 对齐时间戳：

```ts
const closes = candles.map((c) => c.close);
const ma5Values = SMA.calculate({ period: 5, values: closes });
const ma5Data = ma5Values.map((value, i) => ({
  time: candles[i + 4].time, // period - 1 = 4
  value,
}));
ma5Series.setData(ma5Data);
```

均线样式配置：

```ts
const ma5Series = chart.addLineSeries({
  color: "#F6C90E", // 黄色，MA5
  lineWidth: 1,
  priceLineVisible: false,
  lastValueVisible: false,
});

const ma20Series = chart.addLineSeries({
  color: "#3BAFDA", // 蓝色，MA20
  lineWidth: 1,
  priceLineVisible: false,
  lastValueVisible: false,
});
```

实时更新时（WebSocket 推送），同步追加最新一根 K 线的 MA 值：用当前缓存的最近 N 根收盘价重新算最后一个 MA 点，调用 `series.update()` 更新。

---

### 5. 成交量柱

在主图下方新增一个独立的成交量面板，使用 `HistogramSeries`。

```ts
// 创建成交量面板（price scale 独立，不与主图共享 Y 轴）
const volumeSeries = chart.addHistogramSeries({
  priceFormat: { type: "volume" },
  priceScaleId: "volume", // 独立 Y 轴
});

chart.priceScale("volume").applyOptions({
  scaleMargins: { top: 0.8, bottom: 0 }, // 成交量占图表下方 20%
});
```

成交量数据格式（从 REST K 线接口取，index 5 是成交量）：

```ts
const volumeData = candles.map((c, i) => ({
  time: c.time,
  value: parseFloat(rawKlines[i][5]), // Binance 返回的原始数据第 5 项是成交量
  color: c.close >= c.open ? "#26a69a" : "#ef5350", // 涨绿跌红
}));
volumeSeries.setData(volumeData);
```

---

### 6. 组件 Props 接口

```ts
interface KLineChartProps {
  symbol?: string; // 默认 "BTCUSDT"
}
```

### 7. 接入到页面

在现有页面（Orderbook 所在页面）中引入 `KLineChart`，布局建议：

```
┌─────────────────────────────┐
│         K 线图表             │  ← KLineChart 组件，高度 400px
├──────────────┬──────────────┤
│   Buy 盘口   │   Sell 盘口  │  ← 现有 Orderbook
└──────────────┴──────────────┘
```

---

### 8. 历史数据懒加载（向左滚动自动补充）

监听图表可视范围变化，当用户滚动到最左侧时自动请求更早的数据，追加到图表头部。

**核心实现：**

```ts
// 用 ref 记录当前最早一根 K 线的时间戳（秒），用于请求更早数据的 endTime
const oldestTimeRef = useRef<number | null>(null);
const isLoadingMoreRef = useRef(false); // 防止重复请求

// 初始化完成后挂载监听
chart.timeScale().subscribeVisibleLogicalRangeChange(async (range) => {
  if (!range) return;

  // 当可视区域左边界 < 10 根时，触发加载
  if (range.from < 10 && !isLoadingMoreRef.current && oldestTimeRef.current) {
    isLoadingMoreRef.current = true;
    await loadMoreHistory();
    isLoadingMoreRef.current = false;
  }
});
```

**loadMoreHistory 实现：**

```ts
async function loadMoreHistory() {
  if (!oldestTimeRef.current) return;

  // endTime 用当前最早时间戳（ms），往前再取 200 根
  const endTime = oldestTimeRef.current * 1000;

  const res = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200&endTime=${endTime}`,
  );
  const raw = await res.json();

  // 最后一根和现有数据重叠，去掉
  const newCandles = raw.slice(0, -1).map((item: any) => ({
    time: item[0] / 1000,
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4]),
  }));

  if (newCandles.length === 0) return;

  // 更新最早时间戳
  oldestTimeRef.current = newCandles[0].time;

  // 将新数据插入到现有数据头部，合并后重新 setData
  const existingData = candlesRef.current; // 用 ref 缓存当前全量数据
  const merged = [...newCandles, ...existingData];
  candlesRef.current = merged;

  candleSeries.setData(merged);

  // MA 和成交量也要同步更新（重新基于 merged 计算 setData）
  rebuildMA(merged);
  rebuildVolume(merged, raw);
}
```

**注意事项：**

- `candlesRef` 需要在组件内用 `useRef` 缓存当前全量 K 线数据，`setData` 每次需要传完整数组
- `isLoadingMoreRef` 防止用户快速滚动时触发多次并发请求
- 周期切换时记得重置 `oldestTimeRef` 和 `candlesRef`
- Binance 的 `endTime` 参数是毫秒级时间戳，返回的是 `endTime` 之前（不含）的数据

---

## 注意事项

- `lightweight-charts` 需要在客户端渲染，组件顶部加 `'use client'`
- 图表实例和 series 实例用 `useRef` 保存，不要放进 `useState`（避免不必要的重渲染）
- WebSocket symbol 要转小写：`BTCUSDT` → `btcusdt@kline_1m`
- 周期切换时注意先 `ws.close()` 再开新连接，避免多个 ws 并存
- Binance REST API 在国内可能需要代理，本地开发遇到 CORS/网络问题属正常现象，部署到 Vercel 后无此问题

---

## 完成标准

- [ ] 页面加载后自动展示最近 200 根 1m K 线
- [ ] K 线实时更新，当前这根蜡烛跳动
- [ ] 切换周期后图表正确重载
- [ ] MA5（黄）、MA20（蓝）均线叠加在主图上，随 K 线实时更新
- [ ] 图表下方显示成交量柱，涨绿跌红
- [ ] 向左滚动或缩小时自动加载更早历史数据，无缝填充
- [ ] 组件卸载时 WebSocket 正常关闭，无内存泄漏
