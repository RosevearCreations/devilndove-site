# Development Roadmap

## Current completed foundations

- auth and session model
- member orders/downloads
- admin users/security tools
- checkout and order creation
- PayPal handoff
- PayPal return capture
- PayPal webhook reconciliation foundation
- analytics and visitor monitoring foundation
- product SEO tools
- product media workflow foundation
- site inventory/reorder foundation
- movie cover pipeline with R2-backed imagery
- movie shelf pagination foundation
- mobile finished-product capture foundation

## Strongest next steps after this pass

1. Stripe payment completion pass
2. webhook retry / replay / dispatch hardening
3. direct media upload workflow to R2 lifecycle completion
4. deeper inventory operations for products, tools, and supplies
5. product import seeding refinement and validation UX
6. richer analytics dashboards and funnel reporting

## Media-specific roadmap

- direct upload endpoint hardening and broader reuse
- image delete/reorder UI polish
- thumbnail/variant handling
- tighter annotation-to-storefront usage
- stronger duplicate handling and media lifecycle audit coverage

## Payment-specific roadmap

- webhook replay safety
- idempotency improvements
- provider retry logging
- refund/dispute workflows
- provider-confirmed reconciliation flows
- invoice / refund / return receipt delivery

## Current pass completion update

- Repaired the movie shelf layout so cards no longer collapse into unusable one-character columns under grid pressure.
- Updated the movie API and page to use real paging metadata instead of treating the first batch as the whole catalog.
- Improved movie shelf usability with proper page counts, next/previous controls, and more honest result counts.
- Hardened key auth/payment/media JSON responses with safer baseline response headers.
- Improved admin media upload reliability by allowing same-site auth-cookie fallback in addition to bearer auth.
- Rewrote the Known Gaps and Risks document so it reflects the current state more honestly and can guide the next security/customer-experience passes.

## Still intentionally not marked complete

- Stripe completion
- worker-driven webhook retry/replay
- provider-confirmed refund/dispute sync
- full media lifecycle completion
- full authoritative inventory movement model
- richer funnel analytics
- trusted movie metadata/value enrichment


## Current pass update

- Rebuilt the public movie shelf layout with a dedicated card and pager structure so movie entries no longer collapse into unusable one-character columns.
- The movies page now uses the API paging metadata to show the real total catalog size, page number, page range, and next/previous navigation more honestly.
- Added a more defensive movie-specific CSS layer so future generic card/grid changes are less likely to break the movie shelf again.
- KNOWN_GAPS_AND_RISKS.md was rewritten to document the remaining payment, inventory, media, analytics, and metadata risks more clearly.


## Current pass completion update

- Added an `admin_action_audit` trail so privileged product, inventory, media, and webhook actions now have durable server-side records.
- Hardened account recovery requests with basic rate limiting and stored IP/user-agent context for safer review.
- Improved webhook processing bookkeeping by incrementing attempt counts and scheduling next retry timestamps for failed provider events.
- Added a read endpoint foundation for audit visibility at `/api/admin/audit-log`.

## Current pass completion update

- Addressed the payment/refund safety item with provider-aware refund sync attempts and queued receipt records.
- Addressed the webhook retry/replay item with a new admin webhook dispatch endpoint for due/failed event requeueing.
- Addressed the inventory-authority item with a rewritten inventory API that supports reserve/release/receive/reorder-request actions plus stronger movement logging.
- Addressed the media-lifecycle item with restore/replace metadata support and duplicate visibility in admin media assets.
- Addressed the analytics item with stronger funnel metrics in dashboard summary and visitor analytics.
- Addressed the draft-to-publish governance item with product readiness checks and storefront-readiness flags.
- The roadmap is not fully finished yet because Stripe checkout completion, real receipt delivery, deeper attribution, and trusted movie enrichment still remain open.



## Current pass completion update

- Restored and completed the Stripe return reconciliation path with `/api/stripe-return` plus confirmation-page finalize logic.
- Added provider-confirmed Stripe dispute sync through `charge.dispute.*` webhook handling.
- Added a real `notification_outbox` dispatch path with Resend-ready email delivery and admin processing controls.
- Added shared admin step-up confirmation for destructive actions.
- Added `/api/creations` so finished creations can move toward one public authority path instead of direct page-level JSON reads.

## Still intentionally not marked complete

- trusted movie metadata/value enrichment remains blocked on external metadata-source access
- full provider-confirmed dispute sync for every payment provider remains dependent on each provider's API coverage and credentials
- full attribution and decision-grade merchandising analytics still need another pass

## Current pass completion update
- Added governed product approval/publish actions with audited review history.
- Added product build-cost rollups so linked tool/supply costs can be checked before publishing.
- Added supplier purchase-order draft tables and API coverage to move reorder work beyond ad-hoc notes.
- Expanded analytics with top-referrer, entry-path, and zero-result search diagnostics.

## Still intentionally not marked complete
- fully automated worker-driven webhook retries beyond admin dispatch
- full multi-role permission granularity beyond current admin/member model
- fully trusted external movie enrichment and valuation data



## Current pass completion update
- Reduced another public JSON duplication point by adding centralized tools/supplies API reads for outward-facing pages and search.
- Moved purchase-order receiving closer to authority by applying ordered quantities to incoming stock and received quantities to on-hand stock.
- Remaining inventory work should now focus more on reservation governance and UI depth instead of basic supplier receiving math.

## Current pass completion update

- Added product-level reservation actions for linked tool/supply inventory.
- Product cost/reporting endpoints now expose buildable-unit and resource-shortage signals.
- Public catalog APIs now expose filter-group summaries for stronger category/discovery UX.
- Mobile quick-product bootstrap reliability improved by switching to shared admin auth and corrected inventory-field usage.
