# Project Structure / 项目结构

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

```
WebSocket → Services → Stores → Components
WebSocket → 服务层 → 状态管理 → UI组件
```

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

- ~~Map 最多保留 200 条价格档位~~ ← 已移除
- 引入序列缺口处理（gap detection）后，每个增量更新均经过连续性校验，保证数据顺序正确
- Latest-Wins 裁剪会删除合法价位，与 gap detection 的正确性保证存在冲突，因此移除
- 快照从 1000 档降到 100 档（与 MAX_LEVELS=50 对齐，减少无效数据传输）

**交易数据**:

- 缓冲区累积过多时，只返回最新 50 条
- 丢弃过时的旧交易
- 确保用户看到最新数据

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

遵循 Binance 官方文档的本地订单簿维护流程：

**同步流程 / Sync Flow**：

```
1. 建立 WebSocket 连接，Worker 开始缓冲所有事件
   Connect WebSocket — Worker buffers all incoming events

2. 并行拉取 REST 快照
   GET /api/v3/depth?symbol=BTCUSDT&limit=1000

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

| 字段 | 含义 |
|------|------|
| `U`  | 本次事件首个更新ID / First update ID in event |
| `u`  | 本次事件末个更新ID / Final update ID in event |
| `pu` | 上一事件末个更新ID / Previous final update ID |

**为什么 `@depth@100ms` 使用 `pu` 而非 `U` 连续性检测 / Why use `pu` not `U` for continuity**：

`pu` 直接等于上一事件的 `u`，单字段即可完成连续性判断；而 `U` 需要计算 `prevU + 1`，在 100ms 聚合流中更容易产生误判。

#### 其他优化 / Other Optimizations

- ✅ **react-window** 虚拟化列表渲染
- ✅ **React.memo** 优化行组件
- ✅ **useMemo/useCallback** 缓存计算结果
- ✅ **Zustand selectors** 颗粒化状态订阅
- ✅ **动态容器高度** 根据面板大小调整显示数据量

### 4. Type Safety / 类型安全

- 严格的 TypeScript 配置
- 完整的数据结构类型定义
- 类型安全的 WebSocket 消息处理

## Technical Trade-offs / 技术权衡

### 为什么不在 Worker 中使用 lodash throttle？

**当前方案**：自定义限流逻辑（累积 + 定期返回）

**原因**：

1. **数据累积需求**
   - 需要持续累积所有增量更新到 Map/Buffer
   - lodash throttle 会直接丢弃限流期间的调用
   - 我们的场景是"累积所有更新 + 定期输出快照"

2. **更精确的控制**

   ```typescript
   // 当前实现：累积数据 + 定期返回
   processOrderBook(data) {
     currentBids.set(price, quantity); // 持续累积
     if (now - last < 100) return null; // 限流
     return snapshot; // 定期返回
   }

   // 如果用 throttle：会丢失中间数据 ❌
   const throttled = throttle(processOrderBook, 100);
   ```

3. **零依赖** - Worker 文件保持轻量，不需要打包 lodash

4. **Latest-Wins 策略** - 需要在限流期间持续更新内存状态
