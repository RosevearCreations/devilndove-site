# Devil n Dove Project Status and Roadmap — Build 245

This is the **second canonical current project file**. `AI_HANDOFF.md` owns architecture, data authority, fallback and deployment rules. This file owns current progress, risks and ordered next work.

## Build 245 completed work — 20 repository-side advances

1. Merged the complete Build 244 D1 tool/supply authority and fractional-usage transition into the user’s latest live source rather than allowing the live branch to fall behind the generated inventory work.
2. Made the current Build 245 migration capable of upgrading a Build 243-era production D1 directly: the Build 244 transition is included and remains idempotent when already present.
3. Retained all 897 legacy tool/supply master rows in the D1 migration path while keeping the old JSON masters read-only provenance/emergency fallback only.
4. Replaced false admin “Please log in” behaviour on transient Cloudflare 5xx with provisional, verified and degraded auth states.
5. Restricted automatic local-session clearing to explicit server 401/403 rejection; 5xx, timeouts and Worker-limit responses retain the cached admin identity for UI continuity while APIs remain server-authenticated.
6. Added a shared `DDAdminAccessState` / `DDWhenAdminReady()` gate so admin modules can defer work until provisional/verified access is established instead of racing `dd:admin-ready`.
7. Staggered dashboard summary, Today tasks, smoke badges, Deployment Preflight and Release Control reads rather than launching them all at refresh; Preflight and Release Control are now sequential rather than parallel.
8. Routed those secondary reads through shared safe JSON handling with in-flight deduplication, bounded retry/backoff and explicitly stale read-only fallback.
9. Added `/api/admin/inventory-bootstrap`, a small D1 reference endpoint for categories/unit presets/source types/usage modes that does not load the full catalog/Amazon registry or perform request-time DDL/PRAGMA.
10. Added server-side Inventory Operations pagination (80 rows by default) and Previous/Next controls so a large inventory does not require one broad Worker/D1 response.
11. Expanded inline Inventory Operations editing so category, supplier, tool/supply classification, quantity, stock unit, usage unit, usage conversion, tracking mode, reorder level, unit cost and active status can be corrected from the table.
12. Preserved Build 244 exact/estimated/log-only/reusable fractional usage and mobile/Creative Project consumption paths while making their unit fields easier to review and edit.
13. Rebuilt Product Detail loading to recover supporting product imagery deterministically from `product_images`, non-deleted `media_assets`, active role assignments and image annotations, deduped into the seven editor slots.
14. Corrected Product Editor load paths so `images` and `media_integrity` are passed into the form on every reopen instead of loading only the product/SEO record.
15. Added non-destructive migration recovery that inserts only missing gallery references and never deletes existing product images or overwrites an already-selected featured image.
16. Added `product_media_integrity_snapshots` so products with recoverable linked/history images can be audited after migration rather than silently losing evidence.
17. Fixed the Today-task “Product readiness blockers catalog” Open action to drill into `/admin/readiness/?filter=basic_catalog_blockers`, matching missing featured image, price and short-description blockers.
18. Made Product Readiness render a visible Retry/Catalog fallback on temporary API failure instead of a blank page, and removed request-time schema repair from Product Readiness/Product Images live handlers.
19. Completed a CSS/mobile drift pass on the changed admin interfaces: dark-compatible degraded-auth panels, high-contrast Inventory buttons/inputs, responsive inline-unit fields, 44 px mobile targets and stacked pagination/actions; service-worker shell advanced to **v22**.
20. Synchronized the Build 245 numbered/current migration and aggregate schemas, added a read-only D1 verification script, lower-case database-object audit, product-media/auth regressions, public SEO/H1 audit, asset audit, canonical Markdown refresh and historical Build-doc archival.

## Current position

The live problems that triggered this pass now have direct code fixes rather than message-only fallbacks. A temporary Worker/D1 outage should no longer turn a valid cached admin identity into a false signed-out screen. Admin refresh generates less nonessential load. Inventory reference data/listing is bounded. Product gallery evidence can be recovered from existing D1 relationships rather than relying solely on whichever rows survived in `product_images`. The Product Readiness task now opens a meaningful filtered queue.

Build 245 local public SEO audit remains **36/36 passed** with zero warnings/failures and the local `/assets/...` audit remains 120/120 resolved.

Build 245 does **not** claim that Cloudflare can never return another 503 or Worker 1102. It removes observed self-generated pressure and makes failures recoverable/diagnosable. Production Cloudflare Observability remains the authority for any residual Ray-ID incident.

## Known gaps and risks

- Production must back up D1 and apply Build 245 before deploying code that expects the media-integrity tables/policies. Run only the Build 245 numbered file or the byte-identical current-pass file, not both.
- The migration can restore image URLs that still exist in linked D1 media/history, but local/static testing cannot prove that every remote R2 URL is currently reachable or that every historical image still physically exists. Known products that previously had seven images need a production reopen check.
- `product_media_integrity_snapshots` is migration-time diagnostic evidence, not a replacement for the live gallery. A future review queue should surface products where recoverable unique media still exceeds gallery rows.
- `admin_api_health_observations` is a schema foundation; current runtime incident/Cloudflare logs remain the actual evidence until a bounded health-observation writer is added.
- Build 245 reduces dashboard request fan-out, but older specialist/import routes elsewhere can still contain historical schema/expensive-read patterns and should continue moving to migration-owned prerequisites.
- Legacy supplies intentionally remain `log_only` until reviewed; accurate material costing/buildability still requires stock-unit/usage-unit conversion for important consumables.
- Historical tool/supply classification cannot all be safely guessed automatically. The inline table makes correction persistent; a finite classification-review queue remains next work.
- CAIP private bucket production proof, direct browser→R2 multipart signing, proxy/thumbnail/transcript processors and promotion execution remain incomplete.
- Payment exact-once/refund/concurrency, transactional email, restore rehearsal and physical packaging/laser proofs remain Startup evidence work.
- First-page local Google placement cannot be guaranteed. Relevance, distance, prominence, crawlability, useful content, Business Profile completeness and measured conversion evidence remain the practical direction.

## Next 20 steps after Build 245

### P0 — deploy, prove resilience and verify recovered data

1. Back up production D1, apply `database_build245_admin_media_resilience.sql` once, and confirm both Build 244 and Build 245 ledger keys without also running the identical current-pass file.
2. Run `BUILD245_D1_VERIFICATION.sql`; save counts for D1 catalog/inventory, usage profiles, case duplicates, media-integrity snapshots, duplicate gallery URLs and blank-featured-with-gallery results.
3. Deploy the complete Build 245 archive, hard-refresh to service-worker shell v22, and confirm the current script cache-busters are active.
4. Refresh several admin pages while auth is healthy and during/after a temporary 5xx if one occurs; verify the UI says session retained/degraded rather than “Please log in” unless `/api/auth/me` returns an actual 401/403.
5. Search Cloudflare Worker/D1 Observability by any new Ray ID and record whether residual failures are CPU, memory, D1 overload or an application exception; optimize the owning endpoint rather than increasing retry pressure blindly.
6. Reopen several known products that previously had up to seven supporting images and a featured image; verify the gallery returns, featured choice remains stable and remote images themselves load.
7. Add an admin **Media Integrity Review** queue using the latest snapshots/live resolver for products where recoverable linked media exceeds current gallery rows or the featured image is not present in the editor gallery.
8. Add content-hash/object-key duplicate detection for product media so the same binary cannot proliferate under slightly different URLs while preserving legitimate alternate crops/variants.
9. Promote the public R2 `uploads/website-library/` intake into a D1-backed Website Media Library with thumbnail review, source rights, image role, descriptive alt suggestion and page/product assignment.
10. Add bounded bulk image assignment/promotion from the Website Media Library to Product Editor/gallery with explicit preview and no silent public publication.

### P1 — finish inventory/material authority and CAIP production path

11. Add a D1-backed **Classification Review** queue for tool/supply records with reviewed status, reviewer/date/note and explicit bulk correction for selected rows only.
12. Add a **Usage Setup Required** queue for `log_only` supplies missing reviewed stock/usage conversions, with common gram/kg, ml/L, cm/m, piece/package, sheet/pack and wick/spool helpers.
13. Add weighed/physical-count reconciliation: enter actual remaining grams/ml/pieces and write an audited correction movement rather than manually replacing quantities.
14. Add lot-aware fractional consumption and cost-per-usage-unit so product/project profitability uses the correct purchase lot/cost basis.
15. Add reusable-tool maintenance/condition/service/retirement tracking so `reusable` means non-consumed, not maintenance-free.
16. Complete production `CAIP_PRIVATE_MEDIA_BUCKET` liveness and a real interrupted/resumed large MOV/MP4 proof, then add direct browser→R2 multipart signing.
17. Add the first CAIP proxy/thumbnail processor and transcript/timecode provider so large originals are not repeatedly analyzed directly.
18. Complete payment webhook exact-once, refund/concurrency and transaction-email live evidence, plus a D1/R2 restore rehearsal.
19. Finish physical soap/candle/laser proof gates and replace representative public/product imagery with item-specific approved photography where required.
20. Run controlled public launch/release evidence, then track Search Console + Google Business Profile local queries/actions so SEO changes are driven by real impressions, clicks, calls and conversions.

## SEO/local-search direction each pass

Continue one H1 per indexable page, clear title/main-heading alignment, useful descriptions, crawlable descriptive links, truthful image alt text near relevant copy, stable crawlable images, mobile content/alt parity and structured-data/visible-fact agreement. Use buyer language such as custom engraving, personalized gifts, handmade jewelry and Ontario/Southern Ontario only where the page genuinely provides that offer. Competitor review continues to favor clear service/material examples, visible process/quote paths, local intent and strong product imagery; do not copy claims such as same-day service or no-minimum ordering unless Devil n Dove can actually support them.
