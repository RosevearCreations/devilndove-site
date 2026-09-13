# Devil n Dove — Sanity Health Check

Current fully verified checkpoint: **Release 467 Build 149 — Seller Listing Manager & Fast Product Editing**.

- SHA `6ff380f581bce93a42aacb982ba4c686baa5c5c4`
- tree `c1829f6371b3d5b7cd771f9f170260f53d5a7e08`
- System `34776427862`
- Quality `34776427860`
- I.T. `34776427885`
- Hygiene `34776427874`
- Production Pages `34776524835`
- Production Live Resources `34776571549`

Build 150 — **Orders, Fulfillment & Buyer Communication Workspace** — is the active schema-free candidate. It reuses canonical Orders, order-detail, Build 82 fulfilment and `order_status_history` authorities rather than creating a second order backend.

Safety boundaries: local packaging/internal/message drafts never claim live server state; buyer messages are copy-only; fulfilment and tracking changes require explicit live confirmation; stable `client_action_id` values make uncertain response-loss retries idempotent; tracking records an audit handoff only and does not call a carrier or notify a buyer. Payment/refund execution, accounting posting, provider calls, R2 mutation and request-time DDL remain outside Build 150.

Canonical D1 migrations remain `0001`–`0004`. Build 135 transient transport policy remains mandatory. External provider/evidence lanes remain separate.
