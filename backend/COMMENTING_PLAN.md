# Backend Commenting Plan

Updating every method with inline documentation across the backend is a substantial effort. The backend currently spans HTTP controllers, services, models, websocket handlers, logging utilities, and application bootstrap code. To make the work manageable, we can iterate module by module, ensuring context-aware comments without rushing through the code.

## Suggested Iteration Order

1. **Entry Points**
   - `main.rs`
   - `lib.rs`
   - Purpose: establish boot sequence, Actix application construction, and exported modules.

2. **Configuration & Error Handling**
   - `config.rs`
   - `error.rs`
   - Document environment loading, configuration structs, and shared error helpers.

3. **Logging Utilities**
   - `log/mod.rs`
   - `log/subscriber.rs`
   - Explain tracing subscriber setup and log filtering.

4. **API Layer**
   - `api/mod.rs`
   - `api/hyperliquid.rs`
   - `api/status.rs`
   - `api/not_found.rs`
   - Cover Actix route registrations, request handlers, and response types.

5. **Websocket Endpoints**
   - `ws/mod.rs`
   - `ws/handler.rs`
   - `ws/hyperliquid/mod.rs`
   - `ws/hyperliquid/book_price.rs`
   - `ws/hyperliquid/pairs_candle.rs`
   - Detail socket message flows, state management, and stream handlers.

6. **Services**
   - `service/mod.rs`
   - `service/hyperliquid.rs`
   - Describe Hyperliquid client interactions, request construction, and background tasks.

7. **Models**
   - `model/mod.rs`
   - `model/hyperliquid.rs`
   - `model/api.rs`
   - Clarify data structures exchanged between layers, serialization, and domain-specific behavior.

8. **Shared Prelude**
   - `prelude.rs`
   - Note common imports, type aliases, and macros re-exported for ergonomic use throughout the backend.

## Tips for Commenting Each Module

- Prefer **Rust doc comments** (`///`) for public functions and structs so that they appear in generated documentation.
- For private helpers where context is important, inline comments (`//`) can clarify intent without overwhelming the code.
- When documenting asynchronous handlers, outline the main steps (validation, service call, response mapping) to guide future contributors.
- Include references to related modules (e.g., "See `service::hyperliquid` for underlying API calls") to help readers jump between layers.

## Tracking Progress

Consider creating a simple checklist:

- [ ] Entry points documented
- [ ] Configuration and error modules documented
- [ ] Logging utilities documented
- [ ] API routes documented
- [ ] Websocket handlers documented
- [ ] Services documented
- [ ] Models documented
- [ ] Prelude documented

This approach allows multiple contributors to pick a module, document it thoroughly, and open focused pull requests without stepping on each other’s toes.
