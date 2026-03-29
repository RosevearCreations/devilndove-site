# Known Gaps and Risks

## Current pass focus and what was actually improved

This pass concentrated on the two issues most visible to customers and operators right now:
- fully rebuilding the movie shelf cards and pager so the page is usable on real screens
- reducing a few practical reliability/security risks without pretending the full payment and refund roadmap is complete

### What improved in this pass
- The movie shelf was rewritten with a dedicated card layout instead of continuing to fight the inherited shared card/grid styles.
- Movie cards now render as stable two-cover media rows with a separate metadata body instead of collapsing into unusable narrow columns.
- The movies page now reads the real paging metadata from `/api/movies` and shows the correct total, page, page size, and visible range.
- The public movie API continues to support the enriched movie JSON and D1 blend, but now the shelf behavior more honestly reflects the full catalog rather than only the first batch.
- CSS for the movie shelf is now scoped more defensively so future changes to generic `.card`, `.grid`, or admin layout styles are less likely to break the movie page again.
- Existing endpoint hardening from prior passes remains in place: same-site auth-cookie support for admin media upload and safer JSON response headers on several auth/payment/media routes.

## Highest-priority gaps still open

### 1. Payment and refund safety are still not complete
- Stripe checkout is still not fully complete end to end.
- PayPal and Stripe webhook foundations exist, but replay, retry scheduling, operator-safe resend tooling, idempotency review depth, and provider-confirmed refund/dispute synchronization are still incomplete.
- Invoice / refund / return receipts by email or SMS are still unfinished.
- Risk: payment state can still drift from provider state if retries, disputes, or manual corrections are not reconciled cleanly.

### 2. Admin and operational security still need a deeper hardening pass
- Session and auth foundations are usable, and same-site continuity is better than before.
- Recovery, privileged-action verification, stronger permission review, broader audit coverage, and more defensive failure handling are still incomplete.
- Risk: stale sessions, weak recovery controls, or limited operator visibility can still create trust damage and support burden.

### 3. Inventory is useful but still not fully authoritative
- Tools, supplies, and finished products share more structure now.
- Movement history, reservations, supplier workflows, reorder automation, build-cost rollups, and stronger “single movement ledger” behavior remain incomplete.
- Risk: stock counts can still drift when multiple workflows touch the same families without one authoritative movement model.

### 4. Product/media workflow is stronger but still incomplete
- Direct upload to R2 works in more places and is more reliable for same-site admin usage.
- The full lifecycle still needs stronger delete/replace/reorder polish, duplicate handling, thumbnail or variant generation, and tighter storefront annotation usage.
- Risk: media inconsistency still increases admin friction and can reduce storefront polish.

### 5. Analytics remain useful but not yet decision-grade
- Dashboard summary, live activity, and visitor analytics exist.
- Funnel reporting, attribution, conversion diagnostics, build/readiness impact on sales, and abandonment analysis remain incomplete.
- Risk: merchandising and UX decisions can still be made on shallow signals.

### 6. Movie catalog enrichment remains incomplete even though the shelf is now usable
- Covers, paging, and layout are now materially better.
- Many rows still lack trusted title, cast, director, runtime, valuation, rarity, and collection metadata.
- IMDb / AWS enrichment is still pending.
- Risk: collection credibility, filtering quality, and valuation usefulness remain limited until a trusted metadata source is connected.

## Data-model risks

### JSON and D1 still overlap in too many places
- Products, movies, tools, supplies, featured creations, and inventory-adjacent content still move through mixed JSON and D1 pathways.
- Some fallbacks are operationally helpful, but they still create duplicate points of truth.
- Risk: one surface can show newer data while another shows older data.
- Recommended direction: continue staged migration toward D1-backed canonical records, leaving JSON only where it is intentionally static or deployment-friendly.

### Catalog sync is still a bridge, not the final architecture
- Catalog sync remains useful but still acts as a migration bridge.
- Risk: sync drift, partial syncs, and confusing operator expectations remain possible until the final authority model is simplified.

## Customer-experience risks

### Search and product discovery still need refinement
- SEO foundations, one-H1 discipline, canonical/robots hygiene, and structured-data discipline have improved.
- Category depth, search filtering, stronger collection landing-page copy, richer product stories, and clearer product availability messaging still need expansion.
- Risk: good items remain under-discoverable in both search engines and on-site browsing.

### Mobile and small-screen layout still require repeated real-device testing
- This pass materially improves the movie shelf and reduces one of the worst visual failures.
- Admin-heavy screens, tables, nested cards, and dense operational tools still need repeated phone and tablet testing.
- Risk: friction remains for phone-based creation and admin work.

### Draft-to-publish workflow is still not fully governed
- Mobile product capture supports pending review.
- Broader approval, review, publishing governance, and “ready for storefront” validation still need stronger workflow controls.
- Risk: incomplete or weakly reviewed items can still reach the storefront or remain stuck in draft too long.

## Security-forward next steps
- Finish Stripe completion and provider-confirmed reconciliation.
- Add webhook retry/replay safety with auditable operator actions.
- Expand account recovery into verified delivery flows.
- Continue reducing duplicate data sources.
- Improve audit trails for product, inventory, order, and payment changes.
- Add stronger operational visibility around privileged admin actions and destructive media or inventory edits.

## Recommended near-term priorities
1. Complete Stripe payment and webhook hardening.
2. Finish deeper inventory movement and reorder operations.
3. Continue product/media admin polish with stronger R2 lifecycle handling.
4. Expand analytics and funnel reporting.
5. Continue D1 migration for high-value collections.
6. Revisit movie metadata enrichment once IMDb/AWS access is available.
