# Devil n Dove AI Handoff — Build 245

This is the **first of two canonical current project files**. Read this first for architecture, data authority, safety, schema and deployment. Read `PROJECT_STATUS_AND_ROADMAP.md` second for current status, risks and ordered next work. Historical Build prose belongs under `docs/archive/build-history/` and does not override these two files.

## Build 245 in one paragraph

Build 245 retains the Build 244 D1 inventory/fractional-usage transition and fixes three production weaknesses observed in the live application: transient Cloudflare 5xx responses could make a still-valid admin session appear logged out; several admin dashboard widgets could fan out at refresh and increase Worker/D1 pressure; and Product Editor reopened with only part of the image evidence even when additional product media remained linked in `media_assets`, role assignments or annotations. Build 245 introduces provisional/verified/degraded admin-auth states, only clears local auth on an explicit 401/403, staggers secondary admin reads, uses a lightweight inventory bootstrap plus server-side inventory pagination, adds editable category/unit/usage fields in the inventory table, recovers up to seven unique editor images non-destructively from four D1 media sources, preserves a chosen featured image, and fixes the Today-task Product Readiness drill-down so it no longer opens a blank readiness view. Build 245 is a D1 migration release and intentionally includes the Build 244 transition so a production database that has Build 243 but not Build 244 can move directly to Build 245.

## Current system authorities

| Concern | Authority |
|---|---|
| Product identity and sellable facts | D1 product/catalog tables + Product Editor |
| Product editor gallery | D1 `product_images`, recoverable from linked D1 media/history; featured field remains on `products` |
| Tool/supply master catalog | **D1 `catalog_items`** |
| Operational stock, reservations and movements | **D1 `site_item_inventory` + movement/usage tables** |
| Legacy tool/supply JSON | Read-only provenance/emergency fallback; never a normal mutable runtime authority |
| Tool/supply classification | D1 lower-case `tool` / `supply`, editable through Inventory Operations |
| Material depletion policy | `site_inventory_usage_profiles` + stock/usage unit conversion |
| Admin browser identity during temporary 5xx | Provisional cached identity for UI continuity only; every admin API remains server-authenticated |
| Orders/payments/refunds | Existing order/payment/refund authorities |
| Packaging | Labeling & Packaging D1 authorities + specialist docs |
| Creative Project process/material/time evidence | Creative Process / Creative Automation D1 tables |
| Creative media, rights and story evidence | CAIP |
| Private Creative Project originals | CAIP D1 metadata + `CAIP_PRIVATE_MEDIA_BUCKET` |
| Content packages | Content Studio |
| Publication approval/provider reconciliation | Release Board / Social Queue / provider records |
| Launch gates | `startup_readiness_items` + history |
| Cross-project architecture/deployment | **This file** |
| Current status/next steps | **`PROJECT_STATUS_AND_ROADMAP.md`** |

Mutable business state belongs in D1 whenever a live table exists. JSON and Markdown may be fixtures, provenance, specialist design authority or release evidence, but must not compete with D1 as a second mutable source of truth.

## Admin authentication and degraded-mode rule

Admin-page refresh follows this state model:

```text
cached admin identity + token
  → provisional admin shell
  → /api/auth/me verifies
      200: verified admin
      401/403: genuine rejection → clear cached auth + require login
      5xx/timeout/Worker limit: retain cached identity → degraded admin shell + retry/backoff
```

Cached identity never grants server-side authorization. It only prevents a temporary Cloudflare/D1 outage from incorrectly rendering “Please log in” while the real server session has not been rejected. Actual admin APIs still call the server auth guard.

Secondary dashboard reads must wait for `DDWhenAdminReady()` / `dd:admin-access-granted` and be staggered rather than all firing at DOMContentLoaded. Shared safe GET transport may deduplicate identical in-flight reads, use bounded retry/backoff and return clearly labeled stale read-only data. Writes are never automatically replayed.

## Product-media integrity rule

Product media is intentionally non-destructive. The canonical Product Editor can display at most seven unique editor images, resolved in this order:

1. `product_images` — preferred gallery authority;
2. non-deleted `media_assets` linked to the product;
3. `product_media_role_assignments` that are not removed;
4. `product_image_annotations` history/reference URLs.

Build 245 migration backfills only missing `product_images` URLs from those D1 sources and never deletes existing gallery rows. A selected `products.featured_image_url` is preserved; only a blank featured field may be filled from the first canonical gallery image. `product_media_integrity_snapshots` records migration-time diagnostics and is not a second gallery authority. Public product structured data may expose multiple approved gallery images; SEO/OG media does not replace the supporting product gallery.

## Inventory and material-usage model

Both catalog and working inventory are in D1 but serve different purposes:

```text
D1 catalog_items
  master identity / descriptive catalog
        ↓
D1 site_item_inventory
  actual on-hand/reserved/incoming/cost/unit state
        ↓
usage profile + movements
  actual use and stock effect
```

Build 244 foundations retained by Build 245 include editable tool↔supply classification and `exact`, `estimated`, `log_only` and `reusable` usage modes. Fractional conversion prevents a small amount from consuming a whole container. Example: a 500 g jar with 3 g used records `3 / 500 = 0.006` stock units; if only “a few sprinkles” are known, `log_only` records evidence without fabricating depletion.

Build 245 makes the Inventory Operations hot path lighter: initial dropdown/reference data comes from `/api/admin/inventory-bootstrap`; catalog search is requested only when the operator types; the inventory list is server-paginated (default 80); and ordinary GET paths do not install schema or run PRAGMA repairs.

## Build 245 schema boundary

For production D1:

1. Back up D1 / record a recovery point.
2. Apply **one** of:
   - `database_build245_admin_media_resilience.sql`; or
   - byte-identical `database_upgrade_current_pass.sql`.
3. Do not separately apply Build 244 if production has not yet received it; Build 245 contains the complete Build 244 transition and is idempotent if Build 244 was already applied.
4. Do not apply both current SQL files.
5. Confirm ledger keys `build244_inventory_authority_fractional_usage` and `build245_admin_media_resilience`.
6. Run the read-only `BUILD245_D1_VERIFICATION.sql` and review any reported case duplicates/media-integrity gaps.
7. Deploy matching Build 245 code and hard-refresh so service-worker shell **v22** and current scripts load.

Build 245 creates `product_media_integrity_snapshots` and `admin_api_health_observations`, adds product-media lookup indexes, non-destructively restores missing gallery references from D1-linked media/history, and writes current policy settings. It uses **no TEMP tables and no DROP TABLE**. `database_full_schema.sql` contains the executable current aggregate. The scoped `database_schema.sql` and `database_store_schema.sql` contain Build 245-safe scoped definitions/settings without pretending to own full product-media authorities outside their scope.

## CAIP retained architecture

Private raw Creative Project media remains separate from approved/public media:

```text
Creative Project
  → CAIP private intake
  → D1 session/file/part/governance state
  + CAIP_PRIVATE_MEDIA_BUCKET immutable raw binary
  → proxy/extracted/derived work
  → evidence/story review
  → Content Studio / Release Board
  → rights + consent + privacy approval
  → approved public media / PRODUCT_MEDIA_BUCKET
```

`CAIP_PRIVATE_MEDIA_BUCKET` must remain private with no public `r2.dev` or public custom domain. General website-ready images belong in the public/product bucket intake path, not the private raw bucket.

## Runtime/error-handling rules

1. Schema installation belongs to numbered migrations, not routine operational requests.
2. Only explicit 401/403 may clear a cached admin session because the server rejected it; temporary 5xx/timeouts retain the provisional shell and show degraded status.
3. Shared admin GET transport deduplicates identical in-flight reads and uses bounded retry/backoff for temporary safe-read failures; writes are never automatically replayed.
4. Cloudflare HTML/non-JSON failures surface HTTP status and Ray-ID diagnostics rather than raw `JSON.parse` errors.
5. Stale browser fallback is read-only continuity, never proof of a successful write.
6. Inventory forms keep a browser recovery draft and disable duplicate Save submission while a write is active.
7. Expensive dashboard/status panels load after essential auth/page data and should not compete with business-critical writes.
8. Legacy tool/supply JSON cannot overwrite reviewed D1 classifications through runtime catalog sync.
9. Runtime incidents/health evidence must never store passwords, tokens, cookies, raw binary bodies or unnecessary personal information.
10. Destructive/history-sensitive operations prefer reversible/archive state and audited corrections over silent deletion.

## Public/mobile/SEO guardrails

Every public pass verifies one H1, distinctive concise title, useful meta description, canonical, crawlable descriptive internal links, descriptive alt text, resolvable/crawlable media, mobile content parity and valid structured data. Admin pages remain `noindex,nofollow` and one-H1. Use real Ontario/Southern Ontario service wording naturally and keep public facts consistent with actual offers. First-page local placement is a goal, not a guarantee.

Build 245 static public audit is **36/36 passed**, and the local `/assets/...` audit is **120 references with zero missing**. Product image recovery is intended to strengthen truthful multi-image product evidence, not manufacture SEO imagery.

## Current documentation rule

The two cross-project authorities are only:

1. `AI_HANDOFF.md`
2. `PROJECT_STATUS_AND_ROADMAP.md`

`AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` are compatibility pointers. Specialist documents remain where they own specialist implementation/testing details. Historical Build changed-file/validation prose belongs under `docs/archive/build-history/` and is frozen evidence rather than current planning.
