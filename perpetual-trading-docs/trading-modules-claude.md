# 任务：补充永续合约交易核心模块

## 背景

当前项目已有：
- Orderbook 实时渲染（WebSocket + delta 合并）
- K 线图表（Lightweight Charts + MA5/MA20 + 成交量）
- 成交流水（TradeTape）
- 模拟下单表单（买入/卖出）
- 交易对选择器、连接状态、消息速率

本次任务新增三个模块：
1. **限价 / 市价切换**（下单区 Tab）
2. **杠杆选择器**（下单区）
3. **资金费率展示**（顶部行情栏）

---

## 模块一：限价 / 市价切换

### 位置

下单区（买入/卖出面板）顶部，在价格输入框上方。

### UI 结构

```
[ 限价单 ]  [ 市价单 ]       ← Tab 切换
价格(USDT)
[        0.00        USDT ]  ← 限价单显示，市价单隐藏
数量(BTC)
[      0.000000      BTC  ]
25%  50%  75%  100%
可用  --  USDT
[ 买入 BTC ]
```

### 行为逻辑

- 默认选中「限价单」
- 切换到「市价单」时：
  - 价格输入框隐藏（市价单无需填价格）
  - 价格输入框位置显示文字「以市场最优价成交」
- 两个面板（买入/卖出）的订单类型状态**独立维护**，互不影响
- 当前选中类型高亮（深色背景或下划线），未选中灰色

### 状态管理

在 `orderBookStore` 或新建 `orderEntryStore` 中添加：

```ts
orderType: 'limit' | 'market'  // 每个面板独立
```

---

## 模块二：杠杆选择器

### 位置

下单区，放在「可用余额」和「买入/卖出按钮」之间。

### UI 结构

```
杠杆   [ 10x          ▼ ]     ← 点击弹出滑块面板
       |————●—————————|
       1x            125x
       [ 确认 ]
```

### 行为逻辑

- 默认杠杆 10x
- 点击杠杆展示区域，弹出一个浮层（Popover）
- 浮层内包含：
  - 滑块（1-125，步长 1）
  - 当前数值输入框（可手动输入，输入后同步滑块）
  - 快捷档位按钮：`1x` `5x` `10x` `20x` `50x` `100x` `125x`
  - 「确认」按钮关闭浮层
- 买入/卖出面板**共享同一个杠杆值**（真实交易所逻辑）
- 杠杆值存入全局 store，后续计算可用保证金时会用到

### 状态

```ts
leverage: number  // 默认 10，范围 1-125
```

### 样式要求

- 深色主题，与现有 UI 一致
- 滑块轨道颜色与项目 accent 色一致
- 浮层有轻微阴影，点击浮层外部关闭

---

## 模块三：资金费率展示

### 位置

页面顶部，交易对选择器右侧，新增一行行情统计栏。

### UI 结构

```
BTC/USDT  ▼  | ● 已连接  97 msgs/s        （现有顶部）

71,482.42  ▲2.31%  |  24h最高 71,800.00  24h最低 70,200.00  24h成交量 12,453 BTC  |  资金费率 0.0100%  下次结算 02:34:21
                                                                                                              （新增行情栏）
```

### 数据来源：Binance 公开接口（无需 API Key）

**① 24h 行情统计（REST，轮询）**

```
GET https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=BTCUSDT
```

返回字段：
```json
{
  "lastPrice": "71482.10",
  "priceChangePercent": "2.31",
  "highPrice": "71800.00",
  "lowPrice": "70200.00",
  "volume": "12453.123"   // 成交量（BTC）
}
```

每 5 秒轮询一次，不需要 WebSocket。

**② 资金费率（REST，轮询）**

```
GET https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT
```

返回字段：
```json
{
  "lastFundingRate": "0.00010000",   // 资金费率
  "nextFundingTime": 1699999200000   // 下次结算时间（ms 时间戳）
}
```

每 30 秒轮询一次（资金费率变化慢）。

### 倒计时实现

```ts
// 用 nextFundingTime 计算剩余时间，每秒更新
const remaining = nextFundingTime - Date.now()
const hours = Math.floor(remaining / 3600000)
const minutes = Math.floor((remaining % 3600000) / 60000)
const seconds = Math.floor((remaining % 60000) / 1000)
// 格式：02:34:21
```

### 样式要求

- 价格涨跌颜色：涨绿（`#26a69a`）跌红（`#ef5350`）
- 资金费率正数绿色，负数红色
- 整行背景与顶部导航保持一致，字号略小（12-13px）
- 交易对切换时自动刷新所有数据

### 新建 hook

`hooks/useMarketStats.ts`

```ts
export function useMarketStats(symbol: string) {
  // 管理 24h 行情、资金费率、倒计时
  // 返回 { lastPrice, priceChangePercent, highPrice, lowPrice, volume, fundingRate, nextFundingTime, countdown }
}
```

---

## 注意事项

- 所有新组件顶部加 `'use client'`
- Binance Futures REST 接口域名是 `fapi.binance.com`，与现货（`api.binance.com`）不同
- 国内网络直连可能超时，本地开发属正常现象，Vercel 部署后无此问题
- 杠杆选择器的 Popover 用 `useRef` + `useEffect` 处理点击外部关闭，不要依赖第三方库
- 交易对切换时，`useMarketStats` 的轮询要随 symbol 变化重新发起

---

## 完成标准

- [ ] 下单区顶部有限价/市价 Tab，切换后价格框正确显示/隐藏
- [ ] 杠杆选择器默认 10x，滑块与输入框双向同步，快捷档位可点击
- [ ] 顶部行情栏展示最新价、涨跌幅、24h 高低价、成交量
- [ ] 资金费率展示正确，倒计时每秒更新
- [ ] 交易对切换后所有数据同步刷新
