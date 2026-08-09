# Devil n Dove AI Handoff — Build 244

This is the **first of two canonical current project files**. Read this first for architecture, data authority, safety, schema and deployment. Read `PROJECT_STATUS_AND_ROADMAP.md` second for current status, risks and ordered next work. Historical Build Markdown is evidence only and belongs under `docs/archive/build-history/`.

## Build 244 in one paragraph

Build 244 completes the tool/supply inventory authority transition that Build 243 made safe enough to operate. The former tool and supply JSON masters are no longer competing mutable runtime authorities: the Build 244 migration contains all **897 legacy master rows (399 tools + 498 supplies)**, copies missing rows into D1 `catalog_items`, and database-side populates missing working `site_item_inventory` rows without a Worker-wide sync. Legacy JSON remains read-only provenance/emergency fallback only. Inventory classification can be corrected between tool and supply, including safe consolidation when a duplicate target identity already exists. Material usage is now fractional and unit-aware: exact/estimated usage converts usage units into stock-unit fractions, while `log_only` and `reusable` modes record use without falsely emptying a container/tool. Product Resources, mobile product capture and Creative Project inventory posting preserve fractional quantities. Build 243 request-pressure controls and CAIP remain retained.

## Current system authorities

| Concern | Authority |
|---|---|
| Product identity and sellable facts | Product/catalog tables + Product Editor |
| Tool/supply master catalog | **D1 `catalog_items`** |
| Operational stock, reservations and movements | **D1 `site_item_inventory` + movement/usage tables** |
| Legacy tool/supply JSON | Read-only provenance/emergency fallback; never a normal mutable runtime authority |
| Tool/supply classification | D1 lower-case `tool` / `supply`, editable through Inventory Operations |
| Material depletion policy | `site_inventory_usage_profiles` + stock/usage unit conversion |
| Orders/payments/refunds | Existing order/payment/refund authorities |
| Packaging | Labeling & Packaging D1 authorities + specialist docs |
| Creative Project process/material/time evidence | Creative Process / Creative Automation tables |
| Creative media, rights and story evidence | CAIP |
| Private Creative Project originals | CAIP D1 metadata + `CAIP_PRIVATE_MEDIA_BUCKET` |
| Content packages | Content Studio |
| Publication approval/provider reconciliation | Release Board / Social Queue / provider records |
| Launch gates | `startup_readiness_items` + history |
| Cross-project architecture/deployment | **This file** |
| Current status/next steps | **`PROJECT_STATUS_AND_ROADMAP.md`** |

Mutable business state belongs in D1 whenever a live table exists. JSON and Markdown may be fixtures, provenance, design authority or release evidence, but must not compete with D1 as a second mutable source of truth.

## Inventory and material-usage model

### Catalog versus working inventory

Both now live in D1 but serve different purposes:

```text
D1 catalog_items
  master identity / descriptive catalog
        ↓
D1 site_item_inventory
  actual on-hand/reserved/incoming/cost/unit state
        ↓
usage profile + movements
  how much was actually used and whether stock should decline
```

Build 244 migration populates missing operational inventory directly from D1 catalog rows. The old **Reconcile D1 tools + supplies** control remains a bounded maintenance/recovery action, not a required step after ordinary Amazon/manual entry.

### Tool ↔ supply corrections

`source_type` is editable between `tool` and `supply`. Linked product-resource kinds and catalog classification follow the correction. If an active target identity already exists under the corrected type, Build 244 retains that target as canonical, archives the mistaken source identity and uses a conservative **MAX-stock merge** rather than summing duplicated legacy defaults. Historical IDs remain available for audit/history.

### Fractional usage

Each inventory record can define:

- `stock_unit_label` — jar, bottle, bag, spool, sheet, piece, etc.;
- `usage_unit_label` — gram, ml, cm, sprinkle, use, sheet, wick, etc.;
- `usage_units_per_stock_unit` — how many usage units are in one stock unit;
- `usage_tracking_mode` — `exact`, `estimated`, `log_only`, or `reusable`;
- `minimum_usage_increment` — smallest meaningful entry.

Example:

```text
Mica: 1 jar on hand
stock unit = jar
usage unit = gram
500 usage units per stock unit
3 g used
→ stock change = 3 / 500 = 0.006 jar
→ remaining = 0.994 jar
```

If only “a few sprinkles” are known and no reliable weight can be measured, `log_only` records the project/product use but **does not pretend the whole jar was consumed**. Legacy supplies that do not yet have reviewed breakdowns default conservatively to `log_only`; legacy tools default to `reusable`.

## Build 244 schema boundary

For an existing production D1:

1. Back up D1 / record a recovery point.
2. Confirm prior Build 243 inventory normalization has been applied. The earlier Build 243 `TEMP` cleanup warning does not need to be repeated; Build 244 uses **no TEMP table and no DROP TABLE**.
3. Apply **one** of:
   - `database_build244_inventory_authority_fractional_usage.sql`; or
   - byte-identical `database_upgrade_current_pass.sql`.
4. Do not apply both.
5. Confirm ledger key `build244_inventory_authority_fractional_usage`.
6. Confirm settings:
   - `site.inventory.catalog_authority = d1_build244`
   - `site.inventory.fractional_usage_policy = usage_profile_v244`
   - `site.inventory.legacy_usage_default = log_only_review_required`
7. Deploy matching Build 244 code and hard-refresh so service-worker shell **v21** and current scripts load.

Build 244 creates `site_inventory_usage_profiles`, `site_inventory_usage_movements`, and `creative_project_inventory_usage_details`; copies missing legacy master rows into D1 catalog; database-side populates missing operational inventory; and seeds safe legacy tracking modes without overwriting existing reviewed usage profiles.

`database_full_schema.sql` contains the executable Build 244 aggregate block. `database_schema.sql` and `database_store_schema.sql` remain scoped historical aggregates and explicitly point to the numbered Build 244 migration where they do not own the complete Site Inventory authority.

## CAIP retained architecture

Private raw Creative Project media remains separate from public product media:

```text
Creative Project
  → CAIP private intake
  → D1 session/file/part/governance state
  + CAIP_PRIVATE_MEDIA_BUCKET immutable raw binary
  → proxy/extracted/derived work
  → evidence/story review
  → Content Studio / Release Board
  → rights + consent + privacy approval
  → approved public media
```

`PRODUCT_MEDIA_BUCKET` remains the approved/public product-media path. `CAIP_PRIVATE_MEDIA_BUCKET` must remain private with no public `r2.dev` or public custom domain.

## Runtime/error-handling rules

1. Schema installation belongs to numbered migrations, not routine operational requests.
2. Shared admin GET transport deduplicates identical in-flight reads and uses bounded retry/backoff for temporary safe-read failures; writes are never automatically replayed.
3. Cloudflare HTML/non-JSON failures surface HTTP status/Ray-ID diagnostics rather than raw `JSON.parse` errors.
4. Stale browser fallback is explicitly read-only continuity, never proof of a successful write.
5. Inventory forms keep a browser recovery draft and disable duplicate Save submission while a write is active.
6. Inventory seed search is server-side and bounded so all D1 catalog rows remain discoverable without loading the entire catalog into one Worker request.
7. Legacy tool/supply JSON cannot overwrite reviewed D1 classifications through runtime catalog sync.
8. Runtime incidents must never store passwords, tokens, cookies, raw binary bodies or unnecessary personal information.
9. Destructive/history-sensitive operations prefer reversible/archived state and audited corrections over silent deletion.

## Public/mobile/SEO guardrails

Every public pass verifies one H1, distinctive concise title, useful meta description, canonical, crawlable descriptive internal links, descriptive alt text, resolvable media, mobile parity and valid structured data. Admin pages remain `noindex,nofollow` and one-H1. Local search wording should describe real Southern Ontario/Ontario offerings naturally; first-page placement is a goal, not a guarantee.

Build 244 static public audit remains **36/36 indexable pages passed**, and the local `/assets/...` audit remains **120 references with zero missing**.

## Primary admin routes

- `/admin/inventory-operations/` — D1 inventory/classification/fractional-use authority.
- `/admin/creative-process/` — project material/time review and fractional inventory posting.
- `/admin/creative-automation/` — seven-stage orchestration.
- `/admin/creative-assets/` — CAIP media/evidence/private intake.
- `/admin/content-studio/` — content packages.
- `/admin/content-publications/` — release/publication governance.
- `/admin/packaging-studio/` — labels/packaging.
- `/admin/operational-continuity/` — production evidence/fallback/continuity.
- `/admin/startup-readiness/` — launch gates.
- `/admin/image-manifest/` — mutable visual evidence requirements.

## Current documentation rule

The two cross-project authorities are only:

1. `AI_HANDOFF.md`
2. `PROJECT_STATUS_AND_ROADMAP.md`

`AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md` and `KNOWN_GAPS_AND_RISKS.md` are compatibility pointers. Specialist documents remain only where they own specialist implementation/testing details. Historical Build prose belongs under `docs/archive/build-history/`.
