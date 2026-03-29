# Known Gaps and Risks

## Highest-priority gaps still open

### 1. Payment and refund safety are not yet complete
- Stripe checkout is still not fully complete end to end.
- PayPal and Stripe webhook handling have foundations, but replay, retry, idempotency review, and provider-confirmed refund/dispute synchronization are not yet complete.
- Invoice / refund / return receipts by email or SMS are still a next-phase feature.
- Risk: payment state can drift from provider state if retries, disputes, or manual adjustments are not reconciled cleanly.

### 2. Admin and operational security still need a hardening pass
- Admin routes rely on the current auth/session model but still need deeper hardening around audit coverage, replay safety, permission review, and better defensive failure handling.
- There is no complete account recovery and verified delivery flow yet.
- Risk: operational mistakes, stale sessions, or weak reset/recovery flows can damage trust and create support burden.

### 3. Inventory is usable but not yet top-tier operationally safe
- Tools, supplies, and finished products now share more structure, but movement history, reservations, reorder automation, supplier workflows, and build-cost rollups are still incomplete.
- Risk: stock counts can become inaccurate when multiple workflows update the same item families without a single authoritative movement model.

### 4. Product/media workflow is stronger but still incomplete
- Direct upload to R2 is present in parts of the admin and mobile workflow, but the full media lifecycle still needs delete/replace/reorder polish, variant handling, thumbnail generation, and stronger storefront annotation usage.
- Risk: media inconsistency, duplicate uploads, and missing storefront polish increase admin time and can reduce conversion quality.

### 5. Analytics are useful but still lightweight
- Dashboard summary, live activity, and visitor analytics are in place, but funnel reporting, conversion diagnostics, campaign attribution, and deeper abandonment insights are not yet complete.
- Risk: decisions get made on incomplete signals, which slows down merchandising and marketing improvements.

### 6. Movie catalog is visually much stronger, but metadata enrichment remains incomplete
- Covers and pagination are now working, but many rows still lack trusted title, cast, director, runtime, and valuation metadata.
- IMDb / AWS enrichment is still pending.
- Risk: search quality and collection credibility are limited until trusted metadata sources are connected.

## Data-model risks

### JSON and D1 still overlap in too many places
- Products, movies, tools, supplies, featured creations, and inventory-adjacent content still exist across mixed JSON and D1 pathways.
- Some fallbacks are helpful operationally, but they also create duplicate points of truth.
- Risk: one surface can show newer data while another shows older data.
- Recommended direction: continue staged migration toward D1-backed canonical records with JSON retained only where it is intentionally static or deployment-friendly.

### Catalog sync remains a migration bridge, not the final model
- Catalog sync is useful, but it is still a bridge layer rather than the final single-source architecture.
- Risk: sync drift, partial syncs, and confusing operator expectations.

## Customer-experience risks

### Search and product discovery still need refinement
- SEO foundations, one-H1 discipline, structured data, and metadata quality have improved, but category depth, search filtering, and stronger collection landing-page copy still need expansion.
- Risk: good items remain under-discoverable in both search engines and on-site browsing.

### Mobile and small-screen layout still need continued polish
- Current CSS improvements reduce overflow and overlap, but admin-heavy screens, tables, and nested cards still need repeated testing across real devices.
- Risk: friction for phone-based creation and admin work.

### Draft-to-publish workflow is not fully governed yet
- Mobile product capture now supports pending review, but broader review, approval, and publishing controls still need better workflow coverage.
- Risk: incomplete or weakly-reviewed items can reach storefront or remain stuck in draft too long.

## Security-forward next steps
- Finish Stripe completion and provider-confirmed reconciliation.
- Add webhook retry/replay safety with auditable operator actions.
- Expand account recovery into verified delivery flows.
- Continue reducing duplicate data sources.
- Improve audit trails for product, inventory, order, and payment changes.

## Recommended near-term priorities
1. Complete Stripe payment and webhook hardening.
2. Finish deeper inventory movement and reorder operations.
3. Continue product/media admin polish with stronger R2 lifecycle handling.
4. Expand analytics and funnel reporting.
5. Continue D1 migration for high-value collections.
6. Revisit movie metadata enrichment once IMDb/AWS access is available.
