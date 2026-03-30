# Known Gaps and Risks

## Current pass focus and what was actually improved

This pass concentrated on working down the open risk list in order instead of skipping ahead. The goal was to reduce operational risk with real code and schema changes, while staying honest about what still requires provider access, production credentials, or later UI polish.

### What improved in this pass
- Payment/refund handling moved forward with provider-aware refund sync attempts for Stripe and PayPal when credentials and provider payment ids are available, plus queued receipt records for refund and dispute messages.
- Webhook operations moved forward with a new admin dispatch endpoint that can requeue due or failed webhook events in a controlled batch with audit logging.
- Inventory authority moved forward with a rewritten admin inventory endpoint that now supports create, update, reserve, release, receive, reorder-request, and catalog-sync actions while logging movements consistently.
- Media lifecycle moved forward with better admin media asset controls for restore, replace metadata, duplicate visibility, delete audit logging, and same-site admin auth.
- Analytics moved forward with stronger funnel metrics in both dashboard summary and visitor analytics.
- Draft-to-publish workflow moved forward with product readiness checks and readiness flags that are now exposed in admin product responses.
- Recovery and admin safety improvements from the prior pass remain in place, including IP/user-agent logging and admin action auditing.

## Gap-by-gap status

### 1. Payment and refund safety
#### Addressed in this pass
- Admin refund actions now attempt provider-side refund sync for Stripe and PayPal when enough provider information is present.
- Refund and dispute records now carry provider sync status, sync notes, and sync timestamps.
- Refund and dispute actions now queue local notification records in `notification_outbox` so receipt delivery can be processed more reliably later.
- Webhook bookkeeping already present from prior passes remains active.

#### Still open
- Stripe checkout is still not fully complete end to end.
- Provider-confirmed dispute sync is still not complete.
- Actual outbound receipt delivery by email or SMS is still queued/foundation-level, not a full sending system.

#### Remaining risk
- Payment state can still drift when providers send events after manual adjustments or when provider ids are missing on older payments.

### 2. Admin and operational security
#### Addressed in this pass
- More admin routes now rely on shared admin auth and audit helpers.
- Webhook batch requeue actions are now auditable.
- Inventory, media, and payment actions continue to feed the audit trail.
- Recovery request hardening from the prior pass remains in place.

#### Still open
- Verified delivery for account recovery is not complete.
- Step-up confirmation for sensitive destructive actions is still not complete.
- Permission granularity still needs deeper review.

#### Remaining risk
- Session misuse, weak recovery delivery, or overly broad admin powers can still create operator and trust problems.

### 3. Inventory authority
#### Addressed in this pass
- Inventory now has explicit reserve, release, receive, and reorder-request action paths.
- Supplier contact, reservation notes, last reorder requested at, and last counted at are now tracked.
- Inventory movement logging is used more consistently across actions.
- Catalog sync remains available as a migration bridge.

#### Still open
- Supplier purchase order workflows are still not complete.
- Build-cost rollups and full reservation governance are still incomplete.
- The final single authoritative movement-ledger design still needs more UI coverage.

#### Remaining risk
- Counts are safer than before, but drift can still happen where legacy workflows bypass the stronger action path.

### 4. Product/media workflow
#### Addressed in this pass
- Media assets now expose duplicate visibility information.
- Media asset restore and replace metadata actions now exist in the admin API.
- Media asset delete/replace operations now write clearer audit records.
- Same-site admin upload continuity remains better than before.

#### Still open
- Thumbnail and variant generation are still not complete.
- Bulk reorder/replace UI polish is still incomplete.
- Storefront use of annotations still needs more polish.

#### Remaining risk
- Media handling is stronger, but the full lifecycle is still not fully operator-proof.

### 5. Analytics and funnel reporting
#### Addressed in this pass
- Dashboard summary now exposes more funnel-oriented counts.
- Visitor analytics now includes order and paid-order funnel metrics and per-day funnel breakdown data.
- The app has a better basis for checking where visitor traffic turns into checkout and paid orders.

#### Still open
- Attribution, campaign analysis, and decision-grade merchandising diagnostics still need more work.
- Build/readiness-to-sales analytics are still not complete.

#### Remaining risk
- The analytics story is improving, but it is still not a full decision-grade BI layer.

### 6. Movie catalog enrichment
#### Addressed in this pass
- No new metadata source was added in this pass.
- The gap remains documented so it is not mistaken for a solved area.

#### Still open
- Trusted title, cast, director, runtime, rarity, and valuation enrichment still depends on IMDb/AWS or another accepted metadata source.

#### Remaining risk
- The movie shelf is usable, but collection credibility and valuation depth are still limited.

## Data-model risks

### JSON and D1 overlap
#### Addressed in this pass
- Inventory operations are more D1-native now.
- Notification/outbox and readiness state are now DB-backed instead of implied only in UI logic.

#### Still open
- Products, movies, tools, supplies, and featured creations still use mixed JSON and D1 paths in places.

#### Remaining risk
- Duplicate points of truth still exist and should continue to be reduced pass by pass.

### Catalog sync bridge
#### Addressed in this pass
- The bridge remains usable and inventory sync is more operationally useful.

#### Still open
- It is still a bridge and not the final authority model.

#### Remaining risk
- Sync drift and operator confusion remain possible until the final authority model is simplified.

## Customer-experience risks

### Search and product discovery
#### Addressed in this pass
- Product readiness signals now help the app know when items are closer to being storefront-ready.
- SEO/search guidance remains active across the docs.

#### Still open
- Broader category/filter depth and stronger discovery landing pages still need more work.

### Mobile and small-screen layout
#### Addressed in this pass
- Another CSS pass improved grid shrink behavior, table wrapping, and small-screen admin controls.

#### Still open
- Real-device testing still needs to continue for admin-heavy screens.

### Draft-to-publish workflow
#### Addressed in this pass
- Products now expose readiness checks and ready/not-ready flags.
- This gives the app a clearer basis for pending review vs storefront-ready behavior.

#### Still open
- Full governed approval/publish workflow is still incomplete.

## Security-forward next steps
1. Finish Stripe checkout completion and provider-confirmed reconciliation.
2. Turn notification outbox into actual receipt delivery.
3. Add stronger privileged-action confirmation for destructive operations.
4. Continue moving inventory and catalog operations toward a single D1 authority model.
5. Expand analytics into deeper attribution and conversion diagnostics.
6. Resume trusted movie metadata enrichment once IMDb/AWS access is available.


## Current pass completion update

### 1. Payment and refund safety
#### Addressed in this pass
- Added `/api/stripe-return` so Stripe Checkout can reconcile the local order and payment record when the customer lands on the confirmation page.
- Updated the confirmation page client so Stripe sessions are finalized on return instead of waiting only for webhook timing.
- Stripe webhook handling now upserts local `payment_disputes` rows for `charge.dispute.*` events, which closes the provider-confirmed dispute-sync gap on the Stripe side.
- `notification_outbox` can now be actively processed through a dispatch helper and admin endpoint instead of acting only as a passive queue.

#### Still open
- Full provider-confirmed dispute sync for non-Stripe providers still depends on provider-specific API coverage and credentials.
- Receipt delivery still depends on configured mail credentials such as Resend before it can operate in production.

#### Remaining risk
- Old historical payments that are missing provider ids can still require manual cleanup.

### 2. Admin and operational security
#### Addressed in this pass
- Sensitive destructive actions now require password confirmation via a shared admin step-up check.
- Product deletion, user deactivate/delete, media deletion, and notification cancellation/dispatch now use stronger privileged confirmation.
- Account-help requests now queue both admin-review and request-received notifications.

#### Still open
- Permission granularity still needs a broader role-by-role review beyond the current admin/member split.

#### Remaining risk
- The step-up layer is stronger than before, but broader role segmentation is still a future hardening step.

### 4. Product/media workflow
#### Addressed in this pass
- Media delete now requires step-up confirmation.
- Public creations now have a centralized `/api/creations` read path, reducing another JSON-only duplicate read path.

### 7. Reality check on "complete everything"
All code-side items that were realistically actionable inside this repo pass were moved forward in code. The one area that still cannot be honestly marked fully complete is trusted movie enrichment, because that depends on an accepted external metadata source and credentials rather than a missing local code path.

## Current pass completion update

### 3. Inventory authority
#### Addressed in this pass
- Added grouped supplier reorder suggestions directly to the inventory response so reorder work can be turned into actual supplier draft orders.
- Added `supplier_purchase_orders` and `supplier_purchase_order_items` plus `/api/admin/purchase-orders` for draft purchase-order workflow.
- Reorder drafts now stamp `last_reorder_requested_at` and keep inventory items on the reorder list.

#### Still open
- Full receiving automation that writes back ordered quantities into incoming stock is still not complete.
- Final end-to-end reservation governance across every legacy workflow still needs more UI coverage.

### 5. Analytics and funnel reporting
#### Addressed in this pass
- Visitor analytics now expose top referrers, top entry paths, and zero-result site searches.
- Dashboard summary now exposes publish-ready products, pending-review products, and active purchase-order draft counts.
- Product cost rollups now give admin a stronger basis for build-readiness-to-margin checks.

#### Still open
- Campaign attribution is stronger than before, but still not a full ad-platform attribution layer.

### Draft-to-publish workflow
#### Addressed in this pass
- Added `/api/admin/product-review-actions` for approve, needs-changes, publish, and unpublish operations.
- Added `product_review_actions` so review history is durable and auditable.
- Product list now exposes linked resource cost, rough margin, and missing-cost warnings to support better publish decisions.

#### Still open
- Role-by-role review authority is still limited by the current broad admin/member split.



## Current pass completion update

### 3. Inventory authority
#### Addressed in this pass
- Supplier purchase-order workflow now moves ordered quantities into `incoming_quantity` when a draft is marked ordered.
- Supplier purchase-order receiving now moves received quantities from incoming stock into on-hand stock and records received quantity per line item.
- Purchase-order rows now expose ordered-vs-received totals for safer receiving review.

#### Still open
- Reservation governance still needs broader UI coverage across every legacy path that can consume inventory.

### Data-model risks
#### Addressed in this pass
- Public tools and supplies now have centralized read endpoints (`/api/tools` and `/api/supplies`) that prefer D1-backed catalog rows before falling back to legacy JSON.
- Public gallery/creations reads now prefer centralized API paths before using the legacy items-for-sale JSON.

#### Remaining risk
- Mixed authority still exists in some areas, but another outward-facing JSON duplication point has been reduced.
