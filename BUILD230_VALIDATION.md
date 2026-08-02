# Devil n Dove Build 230 Validation

## Result

Local package validation passes. The final ZIP name and SHA-256 are reported with the release handoff after the archive is created. Local success does not prove production bindings, real-device behaviour, real imagery, payments, email, provider permissions, physical stock/packaging or search ranking; those remain Startup gates.

## Local checks

- `node scripts/build230_visual_manifest_test.mjs` passes: 43 unique Startup gates, 20 unique manifest requirements, a 12-step missing-image gate, read-only Unsynced fallback, generated provenance checksums, current/numbered migration identity and one-H1 changed pages.
- All 471 JavaScript/ES-module files under Functions, public browser code, scripts and the service worker pass `node --check`.
- `python3 scripts/deployment_preflight_static_check.py` reports Ready with 0 blockers and 0 warnings.
- `python3 scripts/predeploy_sanity_check.py` reports 108 exposed HTML pages and 0 issues, including one H1/title/meta/image-alternative checks and CSS brace drift.
- `python3 scripts/final_deployment_blocker_check.py` passes.
- `database_schema.sql`, `database_full_schema.sql` and `database_store_schema.sql` each execute in disposable SQLite; each has 20 active manifest rows, three generated provenance rows and one Build 230 ledger entry.
- Applying `database_upgrade_current_pass.sql` twice after each aggregate schema leaves exactly 20 rows. The current and numbered Build 230 files are byte-identical and contain no explicit SQL transaction statements.
- All six generated WebPs are sRGB, 1536×1024 or 768×512, below 270 KB, and match `GENERATED_VISUAL_ASSET_REGISTER.md` SHA-256 values.
- Wrangler 3.114.17 compiles Pages Functions successfully to one 4,888,885-byte worker bundle.
- The two canonical current Markdown authorities, specialist visual provenance/capture guides and historical-retirement policy pass the static authority check.

## Required live and physical evidence

1. Back up D1, confirm Build 229 and apply one Build 230 migration name.
2. Confirm ledger, both manifest tables, 20 active rows and three generated provenance rows.
3. Load Startup’s 43 gates and the Visual Image Manifest from D1; prove their full fallbacks separately.
4. Review Home, Handmade Jewelry, Gift Cards and the manifest on real phones/tablet/desktop; record crop, overlap, focus, touch, slow-network and accessibility results.
5. Approve or replace the three editorials deliberately. Keep every real-photo requirement and item-specific launch-product image role open until accurate rights-cleared evidence exists.
6. Confirm generated paths do not appear in Product/Offer schema, product galleries, marketplace proof or Business Profile photo workflows.
7. Complete the remaining payments, inventory, refund, email, tax/shipping, packaging/regulatory, restore, Search Console/Business Profile and controlled-opening gates.
