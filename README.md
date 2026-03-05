# Project Structure / 项目结构

## Delivery Info / 交付信息

- GitHub Repository: `https://github.com/vaezc/perpetual-trading`
- Public Deployment (Vercel): `https://perpetual-trading-two.vercel.app`
- Backend Feed:
  - WebSocket: `wss://fstream.binance.com/stream?streams=<symbol>@depth@100ms/<symbol>@trade`
  - Snapshot REST: `https://fapi.binance.com/fapi/v1/depth?symbol=<SYMBOL>&limit=1000`

## Directory Overview / 目录概览

```
src/
├── app/                      # Next.js App Router / 应用路由
│   ├── layout.tsx           # Root layout / 根布局
│   ├── page.tsx             # Main trading page / 主交易页面
│   └── globals.css          # Global styles / 全局样式
│
├── components/              # UI Components / UI 组件
│   ├── OrderBook/           # Order book component (bids/asks) / 订单簿组件（买卖盘）
│   ├── TradeTape/           # Trade history stream / 交易流水
│   ├── OrderEntry/          # Order form (mock submit) / 订单输入表单（模拟提交）
│   ├── MarketSelector/      # Market selection dropdown / 市场选择器
│   ├── ConnectionStatus/    # WebSocket connection indicator / WebSocket 连接状态指示器
│   ├── MessageRate/         # Message rate display (msgs/s) / 消息速率显示（条/秒）
│   └── GridPanel/           # Grid panel wrapper / 网格面板包装器
│
├── hooks/                   # Custom React hooks / 自定义 React Hooks
│   ├── useWebSocket.ts      # WebSocket connection hook / WebSocket 连接钩子
│   └── useDataProcessor.ts  # Web Worker data processor hook / Web Worker 数据处理钩子
│
├── workers/                 # Web Workers / Web Workers
│   └── dataProcessor.worker.ts  # Data processing worker / 数据处理 Worker
│
├── services/                # Business logic layer / 业务逻辑层
│   └── websocket.ts         # WebSocket client service / WebSocket 客户端服务
│
├── stores/                  # Zustand state stores / Zustand 状态管理
│   ├── marketStore.ts       # Market data store / 市场数据状态
│   ├── orderBookStore.ts    # Order book state / 订单簿状态
│   └── tradeStore.ts        # Trade history state / 交易历史状态
│
├── types/                   # TypeScript type definitions / TypeScript 类型定义
│   ├── index.ts             # Centralized exports / 集中导出
│   ├── market.ts            # Market types / 市场类型
│   ├── orderBook.ts         # Order book types / 订单簿类型
│   ├── trade.ts             # Trade types / 交易类型
│   ├── websocket.ts         # WebSocket message types / WebSocket 消息类型
│   └── worker.ts            # Worker types / Worker 类型
│
└── lib/                     # Utility functions / 工具函数库
    └── utils.ts             # Helper functions / 辅助函数（格式化、防抖、节流、批处理）
```

## Architecture Principles / 架构原则

### 1. Data Flow / 数据流

#### OrderBook Pipeline (Futures) / 订单簿处理链路（合约）

1. `BinanceWebSocketClient` 订阅 `@depth@100ms`（合约流）。
2. `useWebSocket` 将 depth 事件转发给 `dataProcessor.worker`。
3. Worker 在 `waiting_snapshot` 状态先缓冲事件。
4. 主线程并行拉取 REST snapshot：`/fapi/v1/depth`，调用 `initSnapshot()` 初始化。
5. Worker 回放缓冲事件并进入 `synced`。
6. Worker 对每个增量执行连续性校验（`event.pu === lastProcessedUpdateId`）：
   - 通过：应用增量，按节流周期输出快照（top levels）。
   - 不通过：返回 `resync`，主线程重新拉 snapshot。
7. 主线程将结果写入 `orderBookStore`，`OrderBook` 组件按 selector 渲染。

#### Trade Pipeline (Futures) / 交易流水处理链路（合约）

1. `BinanceWebSocketClient` 订阅 `@trade`。
2. 事件转发到 Worker，Worker 做批处理（100ms）与 latest-wins（仅 trade）。
3. 主线程收到批次后 `startTransition(() => addTrades(batch))` 写入 `tradeStore`。
4. `TradeTape` 使用虚拟列表渲染。

#### Control & Telemetry / 控制与观测

- 连接状态由 `services/websocket.ts` 统一维护并同步到 `marketStore`。
- 消息速率由 `useWebSocket` 每秒统计并更新 `marketStore.stats.messageRate`。
- 订单簿精度切换在前端本地完成（不发额外请求）：`OrderBook` 按用户选择的 bucket 对价格档位聚合后再渲染。

### 2. State Management / 状态管理

**技术选型**：

- **Zustand** 用于全局状态管理（订单簿、交易记录、市场数据）
- 使用颗粒化选择器（selectors）防止不必要的重渲染
- 不同数据域使用独立的 store

**Store 设计原则**：

1. **单一职责原则 / Single Responsibility**
   - 每个 store 只管理一个数据域
   - `orderBookStore` - 订单簿数据
   - `tradeStore` - 交易记录
   - `marketStore` - 市场信息和连接状态

2. **不可变更新 / Immutable Updates**
   - 使用 `set()` 返回新对象，不直接修改状态
   - 保证 React 能正确检测状态变化

3. **颗粒化订阅 / Granular Subscriptions**

   ```typescript
   // ❌ 错误：订阅整个 store，任何变化都会重渲染
   const store = useOrderBookStore();

   // ✅ 正确：只订阅需要的数据
   const bids = useOrderBookStore((state) => state.orderBook.bids);
   ```

### 3. Performance Optimizations / 性能优化

#### Web Worker 数据处理 / Web Worker Data Processing

使用 **Comlink** 库在 Web Worker 中处理高频数据，避免阻塞主线程：

**数据流 / Data Flow**:

```
WebSocket → Worker (处理) → 主线程 (渲染)
WebSocket → Worker (Processing) → Main Thread (Rendering)
```

**Worker 职责**:

- JSON 解析和数据转换
- 订单簿 merge 和 sort 操作
- 交易数据批处理
- 限流和 Latest-Wins 策略

#### 限流策略 / Throttling Strategy

**订单簿限流 (100ms)**:

- 累积所有增量更新到 Map
- 每 100ms 计算一次排序后的快照
- 中间更新不返回，减少主线程通信

**交易数据批处理 (100ms)**:

- 缓冲区累积交易数据
- 每 100ms 返回一次批次
- 减少状态更新频率

#### Latest-Wins 策略 / Latest-Wins Strategy

**订单簿**:

- 引入序列缺口处理（gap detection）后，每个增量更新均经过连续性校验，保证数据顺序正确
- Latest-Wins 裁剪会删除合法价位，与 gap detection 的正确性保证存在冲突，因此移除
- 快照保持 1000 档以提升重同步鲁棒性，UI 渲染层仅展示前 50 档（`MAX_LEVELS=50`）

**交易数据**:

- 缓冲区累积过多时，只返回最新 50 条
- 丢弃过时的旧交易
- 确保用户看到最新数据

#### 订单簿精度分桶（前端聚合） / OrderBook Price Bucketing (Frontend Aggregation)

- 提供可切换的价格精度档位（`0.01 / 0.1 / 1 / 10 / 50`）。
- 聚合逻辑在前端执行，不触发新的 WS/REST 请求：
  - `bids` 使用向下分桶（floor）
  - `asks` 使用向上分桶（ceil）
- 目标是降低噪音与视觉抖动，帮助用户在“细节精度”和“结构可读性”之间切换。

#### startTransition 优先级调度 / startTransition Priority Scheduling

TradeTape 的数据更新使用 `startTransition` 标记为**非紧急（non-urgent）**渲染：

```typescript
// useWebSocket.ts
startTransition(() => addTrades(batch));
```

**原理**：

- React 将 transition 内的状态更新视为低优先级
- 当用户在 OrderEntry 输入价格/数量时（高优先级），React 可中断并推迟 TradeTape 的重渲染
- TradeTape 数据每 100ms 批量更新一次，短暂推迟不影响用户感知
- OrderBook 不使用 `startTransition`，保持同步更新以确保价格数据的实时性

**效果**：

```
用户交互（输入、点击）  → 立即响应（高优先级）
TradeTape 数据更新      → 可被中断，延迟渲染（低优先级）
OrderBook 数据更新      → 同步更新，保持实时（不使用 transition）
```

**为什么 OrderBook 不用 startTransition**：

订单簿是交易决策的核心数据，价格档位需要实时反映，延迟渲染会造成信息滞后，影响交易判断。TradeTape 是历史流水，短暂的渲染延迟对用户无感知影响。

#### 订单簿序列缺口处理 / Order Book Sequence Gap Handling

遵循 Binance **USD-M Futures** 官方文档的本地订单簿维护流程：

**同步流程 / Sync Flow**：

```
1. 建立 WebSocket 连接，Worker 开始缓冲所有事件
   Connect WebSocket — Worker buffers all incoming events

2. 并行拉取 REST 快照
   GET /fapi/v1/depth?symbol=BTCUSDT&limit=1000

3. 调用 worker.initSnapshot(snapshot)：
   - 丢弃 u <= snapshot.lastUpdateId 的缓冲事件
   - 找到首个合法事件：U <= lastUpdateId+1 AND u >= lastUpdateId+1
   - 按序重放后续缓冲事件
   - 进入 synced 状态

4. 后续每个事件校验：event.pu === lastProcessedUpdateId
   - 通过 → 应用增量，更新 lastProcessedUpdateId
   - 不通过 → 返回 { type: 'resync' }，触发重新拉取快照
```

**序列字段说明 / Sequence Fields**：

| 字段 | 含义                                          |
| ---- | --------------------------------------------- |
| `U`  | 本次事件首个更新ID / First update ID in event |
| `u`  | 本次事件末个更新ID / Final update ID in event |
| `pu` | 上一事件末个更新ID / Previous final update ID |

**为什么在合约 `@depth@100ms` 中使用 `pu` 而非 `U` 连续性检测 / Why use `pu` not `U` for continuity in futures depth stream**：

`pu` 直接等于上一事件的 `u`，单字段即可完成连续性判断；而 `U` 需要计算 `prevU + 1`，在 100ms 聚合流中更容易产生误判。

#### 其他优化 / Other Optimizations

- ✅ **react-window** 虚拟化列表渲染
- ✅ **React.memo** 优化行组件
- ✅ **useMemo/useCallback** 缓存计算结果
- ✅ **Zustand selectors** 颗粒化状态订阅
- ✅ **动态容器高度** 根据面板大小调整显示数据量

### 4. 已识别瓶颈 / Bottlenecks Identified

1. **主线程渲染压力 / Main-thread render pressure**
   - OrderBook + TradeTape 同时高频更新时，React commit 仍可能成为瓶颈。
   - 缓解：Worker 侧限流/批处理、TradeTape 使用 `startTransition` 降优先级。

2. **跨线程传输开销 / Cross-thread transfer overhead**
   - Worker 与主线程之间的大对象传输会增加开销。
   - 缓解：只传必要字段、限制展示档位（`MAX_LEVELS`）。

3. **快照重同步突发开销 / Snapshot resync burst cost**
   - 发生 gap 后重新拉快照会短时间增加网络与处理压力。
   - 缓解：事件缓冲 + 快照回放，尽快恢复一致性。

### 5. 10倍负载扩展策略 / Scaling Strategy (10x)

目标场景：订单簿 200-500 updates/s，成交 50-200 trades/s。

1. **多级限流（Adaptive Throttling）**
   - 根据渲染耗时动态调大 OrderBook/TradeTape 输出间隔（例如 100ms -> 150/200ms）。

2. **数据分层与优先级 / Tiered data and priority**
   - 核心价位（top levels）保持高频；深度档位降频或按需加载。
   - TradeTape 继续低优先级渲染，必要时启用更严格 latest-wins。

3. **结构化快照与增量压缩 / Structured snapshot and delta compaction**
   - 在 Worker 内维持紧凑结构，主线程仅接收最终渲染模型，减少重复排序与对象分配。

4. **可观测性驱动调优 / Observability-driven tuning**
   - 增加 FPS、commit 时间、消息堆积长度、resync 次数监控，按指标调参而非固定阈值。

### 6. 类型安全 / Type Safety

- 严格的 TypeScript 配置
- 完整的数据结构类型定义
- 类型安全的 WebSocket 消息处理

## 技术权衡 / Technical Trade-offs

### 1) Worker 优先处理 vs 主线程简洁性 / Worker-First Processing vs Main-Thread Simplicity

- **Decision / 决策**: 在 `dataProcessor.worker.ts` 中处理 order book merge、排序、批处理。
- **Benefit / 收益**: 避免主线程被高频数据阻塞，输入和交互更稳定。
- **Cost / 代价**: 增加跨线程通信与调试复杂度（Comlink + message boundary）。
- **Mitigation / 缓解**: 仅传输渲染必需字段，保持 Worker API 简单（`initSnapshot`/`processOrderBook`/`addTrade`）。

### 2) 快照+缺口重同步正确性 vs 额外网络开销 / Snapshot + Gap Resync Correctness vs Extra Network Cost

- **Decision / 决策**: 使用 Futures 快照初始化，并通过 `pu` 连续性校验触发 resync。
- **Benefit / 收益**: 保证本地订单簿在乱序/丢包场景下的一致性。
- **Cost / 代价**: gap 发生时会有额外 REST 请求和短时重同步开销。
- **Mitigation / 缓解**: 事件缓冲 + 快照回放，减少重建期间数据抖动。

### 3) 批处理与限流响应性 vs 数据新鲜度 / Batching/Throttling Responsiveness vs Freshness

- **Decision / 决策**: OrderBook/Trade 使用 100ms 批处理与节流窗口。
- **Benefit / 收益**: 显著减少状态写入与重渲染频率，降低卡顿风险。
- **Cost / 代价**: 数据展示会有轻微时间粒度损失（非逐条实时渲染）。
- **Mitigation / 缓解**: 核心价位保持稳定输出，参数可按负载动态调优。

### 4) Trade 最新优先体验 vs 完整历史保真 / Trade Latest-Wins UX vs Full Historical Fidelity

- **Decision / 决策**: TradeTape 在高压下保留最新批次（latest-wins）。
- **Benefit / 收益**: 始终优先展示最新成交，防止列表积压影响交互。
- **Cost / 代价**: 极端突发下可能丢弃部分旧成交事件（显示层面）。
- **Mitigation / 缓解**: 仅作用于 UI 展示链路；核心订单簿链路不采用该策略。

### 5) startTransition 流畅输入 vs Tape 延迟渲染 / startTransition Smooth Input vs Deferred Tape Rendering

- **Decision / 决策**: Trade 更新用 `startTransition` 标记为低优先级。
- **Benefit / 收益**: 用户输入/点击优先，减少可感知输入延迟。
- **Cost / 代价**: TradeTape 在繁忙帧下可能出现轻微延迟渲染。
- **Mitigation / 缓解**: TradeTape 是辅助视图，订单簿价格链路保持同步优先。

### 6) 为什么 Worker 不使用 lodash throttle / Why Not lodash throttle in Worker?

- **Decision / 决策**: 使用自定义“持续累积 + 周期输出”而非 lodash `throttle`。
- **Reason / 原因**:
  - 需要在限流窗口内持续吸收增量到内存状态（而不是丢弃调用）。
  - 便于与 gap 检测、snapshot 回放、latest-wins 组合控制。
  - 减少 Worker 依赖，保持打包体积和运行时简单。
