# Known Gaps and Risks

## Current pass focus and what was actually improved

This pass concentrated on two areas that were hurting trust and usability the most in day-to-day operation:
- the movie shelf layout and paging experience
- the operational hardening work that can be improved safely without claiming that Stripe, refunds, and full webhook recovery are finished

### What improved in this pass
- The movie shelf now uses real paging metadata from the API instead of pretending the first batch is the whole catalog.
- Movie cards were rebuilt to stop collapsing into one-character columns on narrow grid widths.
- Movie card media, text wrapping, and pager controls were hardened for smaller screens and nested layout pressure.
- The public movie API now returns safer pagination metadata and no longer defaults the visible experience to the old 150-item cap.
- Admin media upload now accepts the same-site auth cookie as well as bearer auth, which makes mobile/admin upload flows more reliable.
- Key auth/payment/media endpoints now return JSON with safer baseline response headers such as `X-Content-Type-Options: nosniff` and a stricter referrer policy.

## Highest-priority gaps still open

### 1. Payment and refund safety are still not complete
- Stripe checkout is not yet fully complete end to end.
- PayPal and Stripe webhook foundations exist, but replay, retry scheduling, operator-safe resend tooling, and provider-confirmed refund/dispute synchronization are still incomplete.
- Invoice / refund / return receipts by email or SMS are still not finished.
- Risk: payment state can still drift from provider state if retries, disputes, or manual corrections are not reconciled cleanly.

### 2. Admin and operational security still need a deeper hardening pass
- Session and auth foundations are now usable, but high-confidence audit coverage, stronger recovery verification, broader permission review, and more defensive failure handling still need work.
- Cookie continuity is better than before, but recovery and privileged-action safety are not yet top-tier.
- Risk: stale sessions, weak operator visibility, or weak recovery controls can still create support burden and trust damage.

### 3. Inventory is useful but still not fully authoritative
- Tools, supplies, and finished products share more structure now, but movement history, reservations, supplier workflows, reorder automation, and build-cost rollups remain incomplete.
- Risk: stock counts can still drift when several workflows touch the same item families without one authoritative movement ledger.

### 4. Product/media workflow is stronger but still incomplete
- Direct upload to R2 now works in more places and is more reliable for same-site admin usage.
- The full lifecycle still needs stronger delete/replace/reorder polish, thumbnail or variant generation, duplicate handling, and tighter storefront annotation usage.
- Risk: media inconsistency still increases admin friction and can reduce storefront polish.

### 5. Analytics remain useful but not yet decision-grade
- Dashboard summary, live activity, and visitor analytics exist, but funnel reporting, campaign attribution, conversion diagnostics, and abandonment analysis are still incomplete.
- Risk: merchandising and UX decisions can still be made on shallow signals.

### 6. Movie catalog enrichment remains incomplete even though the shelf is more usable
- Covers and paging now work more honestly.
- Many rows still lack trusted title, cast, director, runtime, valuation, and rarity metadata.
- IMDb / AWS enrichment is still pending.
- Risk: collection credibility and search quality remain limited until the trusted metadata source is connected.

## Data-model risks

### JSON and D1 still overlap in too many places
- Products, movies, tools, supplies, featured creations, and inventory-adjacent content still move through mixed JSON and D1 pathways.
- Some fallbacks are operationally helpful, but they still create duplicate points of truth.
- Risk: one surface can show newer data while another shows older data.
- Recommended direction: continue staged migration toward D1-backed canonical records, leaving JSON only where it is intentionally static or deployment-friendly.

### Catalog sync is still a bridge, not the final architecture
- Catalog sync remains helpful but is still a migration bridge.
- Risk: sync drift, partial syncs, and confusing operator expectations remain possible until the final authority model is simplified.

## Customer-experience risks

### Search and product discovery still need refinement
- SEO foundations, one-H1 discipline, and structured data hygiene have improved.
- Category depth, search filtering, collection landing-page copy, and richer product stories still need expansion.
- Risk: good items remain under-discoverable in both search engines and on-site browsing.

### Mobile and small-screen layout still require repeated real-device testing
- This pass materially improves the movie shelf layout and small-screen behavior.
- Admin-heavy screens, tables, and dense nested cards still need repeated device testing and follow-up cleanup.
- Risk: friction remains for phone-based creation and admin work.

### Draft-to-publish workflow is still not fully governed
- Mobile product capture supports pending review.
- Broader approval, review, and publish governance still needs stronger workflow controls.
- Risk: incomplete or weakly reviewed items can still reach storefront or remain stuck in draft too long.

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
