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
│   └── MessageRate/         # Message rate display (msgs/s) / 消息速率显示（条/秒）
│
├── hooks/                   # Custom React hooks / 自定义 React Hooks
│   └── useWebSocket.ts      # WebSocket connection hook / WebSocket 连接钩子（待创建）
│
├── services/                # Business logic layer / 业务逻辑层
│   └── websocket.ts         # WebSocket client service / WebSocket 客户端服务（待创建）
│
├── stores/                  # Zustand state stores / Zustand 状态管理
│   ├── marketStore.ts       # Market data store / 市场数据状态（待创建）
│   ├── orderBookStore.ts    # Order book state / 订单簿状态（待创建）
│   └── tradeStore.ts        # Trade history state / 交易历史状态（待创建）
│
├── types/                   # TypeScript type definitions / TypeScript 类型定义
│   ├── index.ts             # Centralized exports / 集中导出
│   ├── market.ts            # Market types / 市场类型
│   ├── orderBook.ts         # Order book types / 订单簿类型
│   ├── trade.ts             # Trade types / 交易类型
│   └── websocket.ts         # WebSocket message types / WebSocket 消息类型
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

4. **批量更新优化 / Batch Updates**
   - 高频 WebSocket 消息使用 `batchUpdates` 批量处理
   - 避免每条消息都触发状态更新和重渲染

5. **数据转换在 Store 层 / Data Transformation in Store**
   - WebSocket 原始数据在 store 中转换为应用数据格式
   - UI 组件只消费标准化的数据结构

6. **性能优化策略 / Performance Optimization**
   - 订单簿限制档位数量（50档）
   - 交易记录限制条数（100条）
   - 使用 Map 数据结构加速查找和更新

### 3. Performance Optimizations / 性能优化（计划中）
- ✅ **react-window** 虚拟化列表渲染
- ✅ **requestAnimationFrame** 批量更新（utils中已实现）
- ⏳ React.memo 优化行组件
- ⏳ Zustand selectors 颗粒化状态订阅

### 4. Type Safety / 类型安全
- 严格的 TypeScript 配置
- 完整的数据结构类型定义
- 类型安全的 WebSocket 消息处理

## Next Steps / 下一步计划

1. ✅ 安装依赖 (zustand, react-window)
2. ✅ 创建目录结构
3. ✅ 定义 TypeScript 类型
4. ⏳ 实现 WebSocket 服务
5. ⏳ 创建 Zustand stores
6. ⏳ 构建 UI 组件
7. ⏳ 实现性能优化
8. ⏳ 部署到 Vercel

## Key Files to Implement Next / 接下来要实现的关键文件

1. `src/services/websocket.ts` - WebSocket 连接管理器
2. `src/stores/orderBookStore.ts` - 订单簿状态（支持增量更新）
3. `src/stores/tradeStore.ts` - 交易历史状态
4. `src/components/OrderBook/index.tsx` - 虚拟化订单簿组件
5. `src/components/TradeTape/index.tsx` - 虚拟化交易流水组件
