# Devil n Dove Build 229 Validation

## Result

Local package validation passes. This is not production, printer, regulatory, provider, payment, email or physical-wrap evidence; the related Startup gates remain open until tested in their named environments.

## Verified locally

- The supplied Markdown, PDF and SVG copies match the SHA-256 values in `PACKAGING_REFERENCE_BASELINE.md`.
- The PDF is one A4 page and states the 11 × 1.5-inch canvas, 11 × 0.75-inch centred band, 2 × 1.5-inch oval, 50 mm rear seal, 300 DPI, CMYK and 0.125-inch bleed direction.
- The SVG parses as XML and renders as an 11 × 1.5-inch physical-size strip. Its rear `<circle r="12.5">` is correctly documented as 25 mm diameter, not misreported as the 50 mm target.
- `node scripts/build229_startup_readiness_test.mjs` passes: 43 unique gates, all prior keys retained, `missing_launch_images` Critical, and complete fallback for HTML/incomplete API responses.
- `python3 scripts/deployment_preflight_static_check.py` reports Ready with 0 blockers and 0 warnings.
- `python3 scripts/predeploy_sanity_check.py` reports 107 exposed HTML pages checked and 0 issues; this includes one H1, title/meta and CSS brace drift checks.
- `python3 scripts/final_deployment_blocker_check.py` passes.
- All changed Functions/browser/scripts pass `node --check`.
- `database_schema.sql`, `database_full_schema.sql` and `database_store_schema.sql` each execute in disposable SQLite and contain three active/adopted packaging source rows plus the Build 229 ledger entry.
- `database_upgrade_current_pass.sql` is byte-identical to `database_build229_packaging_reference_authority.sql`, contains no explicit SQL transaction statements and succeeds twice against the aggregate schema without duplicating source rows.
- Wrangler 3.114.17 compiles Pages Functions successfully.
- Packaging reference cards use contained responsive SVG/media rules: three columns on wide screens, two at tablet width and one at phone width; small-screen actions become full width.

## Required live/physical validation

1. Back up D1 and confirm Build 228, then apply one Build 229 migration file—not both names.
2. Confirm the ledger row and exactly three adopted/checksum-bearing packaging source rows.
3. Open Labeling & Packaging on phone and desktop; confirm all three reference cards and the source SVG preview load.
4. Print both controlled rear-seal profiles at 100%, wrap the actual soap, measure the regions and save the approved choice. Do not infer approval from the browser preview.
5. Open Startup Readiness with All statuses and confirm 43 gates plus preserved evidence/history.
6. Complete `missing_launch_images` using every row in `IMAGES_REQUIRED.md`; no missing, broken, fallback, planning-placeholder or rights-unclear launch media may remain.
7. Run the full production smoke, payments, webhook/idempotency, inventory, refund/document, email, accessibility/device, SEO/Search Console, provider and controlled-opening gates.

