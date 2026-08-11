# Build 247 Validation

Repository-side validation completed for this package:

- `node --check public/js/admin-packaging-studio.js`
- `node --check functions/api/admin/packaging-studio.js`
- Python SQLite execution of the aggregate `database_full_schema.sql` succeeded.
- The Build 247 migration was executed a second time in the same SQLite database to confirm idempotent seed counts: 1 formula and 20 content rows (4 claims + 16 ingredients).
- `database_upgrade_current_pass.sql` is byte-identical to `database_build247_packaging_library_truth_layout_rose_palette.sql`.
- All 23 botanical rose files exist and are non-empty.
- Soap renderer boundary check: English ingredient clip ends at x=156; front-oval region begins around x=160. Front oval ends around x=530; French clip begins at x=544 and French text at x=548. This leaves explicit separation rather than overlapping the oval.
- Soap rose rendering is driven by `rose_asset_id`; the old `/assets/packaging/artwork/soap-botanical-purple-rose-v1.png` is no longer the soap template fallback.
- The Layouts & Templates panel contains selectable cards for all loaded templates.
- Permanent delete requires the exact project key in both browser UI and API.

## Physical verification still required
The SVG/layout fixes are repository-validated, but a 100% Actual Size print/wrap test remains the authority for physical fit, legibility and fold/overlap behaviour.
