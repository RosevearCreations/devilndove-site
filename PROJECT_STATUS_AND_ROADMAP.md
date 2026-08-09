# Devil n Dove Project Status and Roadmap — Build 244

This is the **second canonical current project file**. `AI_HANDOFF.md` owns architecture, schema, data authority and deployment rules. This file owns current progress, risks and ordered next work.

## Build 244 completed work — D1 inventory authority and realistic fractional consumption

1. Promoted D1 `catalog_items` to the runtime master authority for tools and supplies; legacy tool/supply JSON is now read-only provenance/emergency fallback only.
2. Added all **897 legacy master rows** to the Build 244 migration payload: 399 tool rows and 498 supply rows.
3. Made the migration provenance-aware so rerunning it does not recreate an old JSON classification after a reviewed D1 tool↔supply correction.
4. Database-side populates missing `site_item_inventory` rows from active D1 tool/supply catalog rows, eliminating the need to run a large Worker sync before normal inventory work.
5. Retained the catalog→inventory sync only as a bounded small-batch maintenance/recovery action and removed Amazon registry matching from that path.
6. Disabled runtime tool/supply JSON re-import in Catalog Sync so stale JSON can no longer overwrite reviewed D1 classification/state.
7. Made existing tool/supply search server-side and bounded, so all D1 rows remain discoverable without loading the complete catalog into a single page/Worker request.
8. Added quick inline tool/supply classification editing in the Inventory Operations table plus full-edit classification control.
9. Added linked classification propagation to `catalog_items` and `product_resource_links` when an inventory item is corrected tool↔supply.
10. Added safe classification-duplicate consolidation when the corrected target identity already exists: target remains canonical, mistaken row is archived, and legacy default stock is not double-counted.
11. Added `site_inventory_usage_profiles` with `exact`, `estimated`, `log_only` and `reusable` tracking modes.
12. Added `minimum_usage_increment` so very small real-world usage can be entered without forcing whole-unit consumption.
13. Added `site_inventory_usage_movements` so usage amount and stock-unit change are both auditable.
14. Legacy tools without reviewed profiles default to `reusable`; legacy supplies without reviewed unit breakdowns default to `log_only` so old “1 use” assumptions cannot empty a full container.
15. Changed inventory stock/reserved/incoming/reorder quantities and unit conversions in the UI/workflows to accept fractional values.
16. Changed Product Resources desktop and mobile quantity-used paths to preserve fractional quantities instead of forcing at least one whole unit.
17. Changed inventory reservation/consumption math to convert actual usage quantity through `usage_units_per_stock_unit` before changing stock.
18. Changed Creative Project material posting/reversal to accept fractional usage amounts, preserve usage-vs-stock evidence, and support log-only/reusable tracking without false depletion.
19. Added a clear 500 g mica example and usage guidance directly to Inventory Operations; a 3 g use can reduce one 500 g jar by 0.006 jar, while unmeasured sprinkles can be logged without reducing stock.
20. Added Build 244 migration/regression, current schema synchronization, mobile/CSS polish and cache shell v21. Current static public SEO remains **36/36 passed**, database object identifiers remain lower-case, and **120/120 local asset references resolve**.

## What “all items in one spot” means now

There are two D1 tables because they solve different business problems, but **both are in the same D1 database authority**:

```text
catalog_items          = master identity/descriptive catalog
site_item_inventory    = real operational stock/cost/reservation state
```

The old JSON files are no longer normal operational storage. Build 244 migrates their rows into D1 and populates missing operational inventory from D1 in SQL. New Amazon/manual items already enter working D1 inventory directly.

## Current position

Inventory is now much closer to the way the workshop actually behaves. A container is not automatically “one use”; one stock unit can contain hundreds or thousands of smaller usage units. Projects/products can record exact fractional consumption, estimated consumption, or a log-only use when measurement would be artificial. Tools can be reusable without depletion. Misclassified tool/supply rows are editable rather than frozen by the original JSON source.

Build 243 request deduplication/backoff/form recovery remains active. Build 244 additionally reduces reliance on broad catalog sync and keeps all catalog searches bounded, which further lowers Worker/D1 pressure.

## Known gaps and risks

- Production must run the Build 244 migration before deploying code that expects usage-profile/usage-movement tables.
- Legacy supplies intentionally default to `log_only` until reviewed. That protects stock from false depletion but means accurate costing/buildability still requires unit conversion review for important materials.
- Existing historical tool/supply classifications inherited from old masters cannot all be safely guessed automatically. Build 244 makes correction fast and persistent; high-value inventory still needs an owner review.
- A classification duplicate merge uses the greater stock counter rather than summing both legacy rows to avoid doubling old default “1” values. If two genuinely separate purchases were intentionally split across duplicate identities, review the canonical quantity afterward.
- Exact usage requires meaningful units. “Sprinkle”, “dab”, “drop”, etc. can be used as estimated/log-only evidence, but cost accuracy improves when grams/ml/cm/pieces can be measured.
- Worker/D1 platform limits can still produce temporary 503s. Build 243/244 reduce self-generated load and preserve state, but production observability remains the authority for any future Ray-ID incident.
- CAIP private bucket binding, direct browser→R2 signing, processing providers and public-promotion executor remain incomplete production work.
- Payment webhook exact-once/refund/concurrency, transactional email, restore rehearsal and production launch evidence remain open.
- Exact item photography and physical packaging/laser proofs remain required where launch gates specify them.
- First-page Google placement cannot be guaranteed; relevance, distance, prominence and measured conversions remain the SEO reality.

## Next 20 steps after Build 244

### P0 — deploy and clean the real inventory authority

1. Back up production D1 and apply `database_build244_inventory_authority_fractional_usage.sql` once; confirm ledger/settings and do not also run the identical current-pass file.
2. Verify post-migration counts for `catalog_items`, active `site_item_inventory`, usage profiles and any archived duplicates; preserve a before/after count report.
3. Deploy Build 244, hard-refresh to shell v21, and confirm Inventory Operations loads without JSON/HTML parsing errors or duplicate startup requests.
4. Review the **Tools only** inventory view and correct obvious supplies misclassified as tools using the inline classification select.
5. Review the **Supplies only** view and correct obvious reusable equipment misclassified as supplies.
6. Add a D1-backed “classification review” queue with reviewed/unreviewed status, reviewer and note so this cleanup becomes finite and auditable rather than repeated visual checking.
7. Add bulk classification correction for explicitly selected rows only, with preview and duplicate-impact warning before write.
8. Add a “usage setup required” inventory view for legacy `log_only` supplies lacking reviewed stock/usage conversion.
9. Add common unit presets/conversions for gram/kg, ml/L, cm/m, piece/package, sheet/pack, wick/spool and similar workshop materials without forcing presets on unusual items.
10. Add container-level remaining display such as `0.994 jar ≈ 497 g remaining` so fractional stock is understandable at a glance.

### P1 — make material costing/project consumption operationally strong

11. Add usage entry directly from a product/project with quick presets (exact, estimated, log-only) and a visible before/after stock preview before posting.
12. Add inventory-lot-aware fractional consumption so material use can be assigned to the correct purchase lot/cost basis rather than only aggregate stock.
13. Add weighed-count correction workflow: enter measured remaining grams/ml/etc. and have the app reconcile the stock-unit fraction with an audited correction movement.
14. Add unit-cost-per-usage-unit display (for example cost per gram/ml/cm) and feed that into product/project profitability.
15. Add a material-usage anomaly check for suspicious events such as “1 whole 500 g jar” where historical/project context suggests a tiny amount.
16. Add a reusable-tool maintenance/condition path so reusable does not mean “never changes”; track wear, service, replacement and retirement separately from consumption.
17. Continue removing remaining request-time schema helpers from older specialist/import routes and move prerequisites into numbered migrations.
18. Add D1-backed website-media-library intake for `PRODUCT_MEDIA_BUCKET/uploads/website-library/`, including thumbnails, roles, alt-text suggestions and page/product assignment.
19. Complete CAIP private R2 production proof with real interrupted/resumed large media, then implement direct browser→R2 multipart signing and the first thumbnail/proxy provider.
20. Complete remaining payment/email/restore/physical-proof Startup evidence and run a controlled paid fulfilment plus refund recovery before widening launch traffic.

## SEO/local-search direction each pass

Continue one H1 per indexable page, distinctive titles/descriptions, canonical URLs, descriptive internal links, useful alt text, mobile parity and structured-data/visible-fact agreement. Use Ontario/Southern Ontario wording only where it matches a real offering. Maintain Business Profile facts/photos/services/hours and measure Search Console, Business Profile and conversion data rather than assuming rank.
