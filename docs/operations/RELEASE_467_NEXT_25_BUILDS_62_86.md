# Release 467 — Next 25 Builds (62–86)

This is the canonical forward roadmap agreed after the September 7, 2026 Products / D1 / admin-runtime stabilization work.

## Numbering note

The conversational planning list used labels 468–492. The repository's actual current authority is Release 467 Build 61, so the same agreed work is canonically numbered **Release 467 Builds 62–86** here. This avoids creating two competing build sequences.

Current starting checkpoint before Build 62:

- Development `dev`: `d93747a0b3fa8c2b27003c9274e993967f021713`
- Production `main`: `d93747a0b3fa8c2b27003c9274e993967f021713`
- Production Pages Deploy: `34129495049` — SUCCESS
- Production Live Resource Integrity Proof: `34129579441` — SUCCESS
- Canonical D1 migrations remain `0001`–`0004`; Build 62 begins schema-neutral.

## Reliability-first sequence

### Build 62 — Products & Inventory Final Reliability
Finish Product load/edit, dropdown recovery, table containment, Firefox/Chrome responsiveness, request coalescing, D1-light cold start, cached recovery, and bounded secondary startup work. Product editing must remain usable when analytics/readiness/replay helpers are slow.

### Build 63 — D1 Read-Budget Protection
Audit high-read APIs, define per-route row-read expectations, paginate large datasets, prevent blank-search scans, add request/query telemetry and operator warnings before Cloudflare daily row-read exhaustion.

### Build 64 — Admin Full-Authority Convergence
Prove the active root administrator has manage authority across every enabled module and shared service. Add a fail-closed automated admin permission matrix.

### Build 65 — Admin Page Lazy Loading
Stop unrelated admin systems from initializing merely because a large workspace opens. Panels and optional services load only when visible/selected/needed.

### Build 66 — Product Workspace Split
Split the monolithic Product surface into focused Products, Editor, Inventory Links, Media, SEO/Publishing and Cleanup/Archive workspaces while retaining one Product authority.

### Build 67 — Product Editor Recovery & Autosave
Harden Load Product, Save Draft, autosave, browser recovery, stale-copy handling and unsaved-change protection. Secondary services never block editing.

### Build 68 — Catalog Options Authority
Converge Category, Colour, Tax Class, Shipping Code, Product Type and related dropdown authorities into one managed/cached/validated source.

### Build 69 — Product CRUD & Duplicate Safety
Finish create/edit/archive/delete correction flows and distinguish unused duplicates from records referenced by orders, accounting, inventory, content or customers.

### Build 70 — Inventory Units & Conversion Engine
Harden base/package units, quantity conversions, partial consumption, reusable tools versus consumables, kits and batches.

### Build 71 — Inventory Lifecycle
Converge receiving → storage → reservation → Product/project usage → release/return → write-off → reorder with history and accounting context.

### Build 72 — Inventory / Reorder Economics
Add recommendation-only reorder quantities, landed cost, supplier comparison, stock coverage and buildable-unit economics. Never auto-purchase.

### Build 73 — Product Media / Photo Studio Convergence
One R2-backed Product photo manager for upload, assign, reorder, crop/focal point, alt text, featured image, galleries, roles and unused-media review.

### Build 74 — Storefront Product Experience
Improve public Product presentation: photography, description, attributes, availability, trust information, related products and responsive performance.

### Build 75 — Storefront Search & Collections
Improve search, filtering, categories, colours, price, availability, collections, zero-result assistance and merchandising intelligence.

### Build 76 — SEO Technical Convergence
Crawl all public routes and enforce one H1, canonical URLs, sitemap/index rules, structured data, metadata, Open Graph and internal-link coverage.

### Build 77 — Canada-Only Commerce Rules
Centralize the current Canada-only sales/shipping boundary so storefront, cart, checkout, address validation, APIs and messaging all agree.

### Build 78 — Cart & Checkout Reliability
Harden cart persistence, stock validation, shipping/pickup, tax, abandoned checkout recovery, failure handling and idempotent order creation.

### Build 79 — Stripe Development Acceptance
Close the six real test dimensions: test credentials, checkout, signed webhook, provider-synchronized test refund, reconciliation and idempotent replay.

### Build 80 — PayPal Sandbox Acceptance
Close sandbox credentials, approval/capture, verified webhook, provider-synchronized sandbox refund, reconciliation and idempotent replay.

### Build 81 — Finance & Accounting Cockpit
Converge orders/payments/refunds → AR/AP → bank reconciliation → expenses → inventory costs → journals → month-end → accountant export.

### Build 82 — Orders / Fulfilment Workflow
Paid → preparing → making/packing → evidence → pickup/shipping ready → fulfilled → returned/refunded, with customer communication and audit history.

### Build 83 — Labeling & Packaging Studio
Complete reusable templates, soap/candle/product packaging, components, cost, artwork, proofs, approvals, exports, reprints and version history.

### Build 84 — Creators / CAIP Workflow
Converge Creative Project → evidence → materials → costs → Product → Content Studio → social assets → profitability while protecting private/raw media.

### Build 85 — Socials & OAuth Acceptance
Complete controlled selected-provider OAuth, intended-account/security evidence, draft publication queues and explicit human approval. Publication remains fail-closed until accepted.

### Build 86 — I.T. Operations & Self-Diagnostics
Make I.T. the operational control centre for D1/R2 usage, bindings, migrations, schema drift, APIs, browser/runtime incidents, deployment SHA, module authority, provider setup, release gates, backup/recovery and corrective instructions.

## Execution policy

Builds execute in order unless a blocking defect requires a bounded reliability repair. Every build must preserve:

- `dev` first; `main` only from an exact fully-green Development tree.
- Canonical append-only D1 migrations; no request-time schema DDL.
- Production business data ownership and no wholesale Dev→Production data replacement.
- No provider/payment/publication execution unless that build explicitly authorizes a controlled acceptance lane.
- No raw CAIP R2 deletion.
- Four exact Development proofs before Production: System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof, Repository Branch Hygiene.
- Exact Preview deployment, Development D1 proof, bindings proof and smoke acceptance where the System Gate requires them.

Build 62 is the immediate next build.
