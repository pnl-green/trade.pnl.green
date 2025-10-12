# Frontend Commenting Plan

Documenting every component, context, and page in the frontend is also a large undertaking. The Next.js app brings together routing, shared providers, dashboard widgets, and styling helpers. To keep the effort approachable, we can tackle one slice of the UI at a time while ensuring each React component, hook, and helper explains its intent and data dependencies.

## Suggested Iteration Order

1. **Application Shell & Routing**
   - `src/pages/_app.tsx`
   - `src/pages/_document.tsx`
   - `src/pages/index.tsx`
   - `src/pages/sub-accounts.tsx`
   - `src/pages/api/hello.ts`
   - Purpose: describe how Next.js bootstraps providers, global layout, and route-level data loading.

2. **Global Context Providers**
   - `src/context/index.tsx`
   - `src/context/hyperLiquidContext.tsx`
   - `src/context/pairTokensContext.tsx`
   - `src/context/orderBookTradesContext.tsx`
   - `src/context/orderHistoryContext.tsx`
   - `src/context/tradeHistoryContext.tsx`
   - `src/context/twapHistoryContext.tsx`
   - `src/context/fundingHistoryContext.tsx`
   - `src/context/switchTradingAccContext.tsx`
   - `src/context/webDataContext.tsx`
   - Highlight provider setup, shared state shape, fetch intervals, and how descendants consume the data.

3. **Layout & Navigation**
   - `src/components/layout/*`
   - `src/components/navbar/*`
   - `src/components/footer/*`
   - Explain shell composition, navigation links, responsive behaviors, and integration with contexts.

4. **Trading Dashboard Core**
   - `src/components/pnlComponent.tsx`
   - `src/components/headMetadata.tsx`
   - `src/components/chatComponent.tsx`
   - `src/components/loaderSpinner.tsx`
   - Document how the main dashboard orchestrates charting, order flow panels, and ancillary widgets.

5. **Market Data Visualizations**
   - `src/components/TVChartContainer/*`
   - `src/components/token-pair-information/*`
   - `src/components/order-book-and-trades/*`
   - Capture chart initialization, subscription lifecycles, and presentation of depth/trade streams.

6. **Order Execution & Risk Tools**
   - `src/components/order-placement-terminal/*`
   - `src/components/positions-history-components/*`
   - `src/components/Modals/*`
   - Describe form state management, validation flows, confirmation dialogs, and history rendering.

7. **Wallet & Connectivity**
   - `src/components/wallet-connect/*`
   - `src/components/handleSelectItems.tsx`
   - Outline wallet adapter usage, chain switching, and shared selection helpers.

8. **Styling Modules**
   - `src/styles/*`
   - Clarify the role of each styling file, exported helper classes, and any theming conventions.

## Tips for Commenting Each Area

- Prefer **JSDoc-style comments** (`/** ... */`) or inline `//` notes near hooks and callbacks to describe props, effects, and state transitions.
- When documenting React components, call out key props, expected context values, and any side effects (subscriptions, timers, event listeners).
- For complex hooks or async functions, summarize lifecycle stages (e.g., "fetch book data", "merge with local cache") to guide future edits.
- Reference related contexts or components to help readers trace where data originates and how it's displayed.

## Tracking Progress

Consider maintaining a checklist as work advances:

- [ ] Application shell & routing documented
- [ ] Context providers documented
- [ ] Layout & navigation documented
- [ ] Trading dashboard core documented
- [ ] Market data visualizations documented
- [ ] Order execution & risk tools documented
- [ ] Wallet & connectivity documented
- [ ] Styling modules documented

This staged approach lets contributors focus on coherent feature areas, ensuring comments remain accurate and meaningful while avoiding large, difficult-to-review pull requests.
