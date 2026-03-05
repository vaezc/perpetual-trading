# Objective

Build a real-time **Sonic Perpetual Trading UI** that connects to a live market feed backend.
The application must handle high-frequency updates while maintaining UI responsiveness.

# Deployment Requirements

- Code must be hosted on **GitHub**
- Application must be deployed publicly on **Vercel**
- Provide:
  - GitHub repository link
  - Public deployed URL
  - Backend API/WS URL used
- Include a README explaining architecture and decisions

⠀

# Core Functional Requirements

### UI Components

- Market selector (single market acceptable)
- Order book (bids & asks)
- Trade tape
- Order entry panel (mock submit)
- Connection status indicator
- Message rate display

⠀

# Real-Time Requirements

The UI must handle:

- 20–50 order book updates per second
- 5–20 trades per second

⠀The interface must remain responsive:

- No noticeable input lag
- No full re-render storms
- No flickering

⠀

# Technical Expectations

Must demonstrate at least TWO of:

- Virtualized list rendering
- Batched state updates
- Granular state subscriptions
- Memoized row rendering
- WebSocket reconnect handling
- Snapshot reset logic when sequence gaps occur

⠀

# Documentation Requirements

README must include:

- Architectural explanation
- Performance decisions
- Bottlenecks identified
- Scaling strategy (10× load scenario)
- Tradeoffs made

⠀

# High-Level Evaluation Criteria

# Real-Time Engineering

- Proper WebSocket lifecycle handling
- Handling of burst traffic
- Correct delta application logic
- Sequence gap handling

⠀Performance & Optimization

- Avoiding unnecessary re-renders
- Intelligent batching/throttling
- Efficient state management
- Responsiveness under load

⠀Architecture & Code Quality

- Clear data/UI separation
- Strong TypeScript usage
- Modular and reusable components
- Clean and readable structure

⠀Product Maturity

- Error states handled cleanly
- Connection indicator visible
- UX clarity and hierarchy

⠀Web3 Readiness

- Ability to reason about stream consistency
- Understanding of indexer-style feeds
- Thoughtfulness about latency and reset scenarios

⠀
⚠ During the review, you may be asked to modify part of the application.
