# New Chat Status

## Current handoff summary

This handoff is updated for the latest repo pass. The build focus remained movie stability, mobile product capture, schema/doc sync, and reducing duplicate truth risks where the repo could safely move forward in one pass.

## Most important current truths
- `data/movies/movie_catalog_enriched.v2.json` remains the active movie base truth.
- `functions/api/admin/catalog-sync.js` now points movie sync work at the v2 JSON source instead of the older enriched file.
- `movie_catalog` in D1 is still a manual/admin overlay layer, not the primary movie truth.
- The public movie tab and admin movie list/editor must continue to load from the JSON-first movie source, then merge any D1 overlay rows on top.
- The admin movie editor must continue to show fuller JSON-backed details, not just image and UPC.
- `database_schema.sql`, `database_store_schema.sql`, and `database_upgrade_current_pass.sql` were brought forward so the schema references better match the current code paths.
- Public exposed pages were checked again and still keep the one-H1-per-page rule intact.

## What just happened
- Earlier movie admin saves could fail on older databases with: `D1_ERROR: table movie_catalog has no column named imdb_id`.
- This pass reduced that drift by aligning the repo schema references and upgrade SQL with the richer movie fields the admin editor expects.
- Catalog-sync movie imports were moved to the same v2 JSON source already preferred by the public/admin movie flows.
- The movies page received another small SEO wording pass around DVD/Blu-ray collection terms.

## Current requested direction
1. Keep movies JSON-first using `movie_catalog_enriched.v2.json`.
2. Keep admin movie editing stable and visually complete.
3. Keep D1 movie writes backward-compatible with older table shapes.
4. Continue moving Known Gaps forward only where it is honest and safe to do so.
5. Keep all Markdown and schema-reference files in sync each pass.

## Movie fields the user expects to see/edit
At minimum, the admin movie workflow should expose and allow edits for:
- UPC
- title
- original title
- summary
- release year
- media format
- genre
- director names
- actor names
- studio name
- runtime minutes
- trailer URL
- front image URL
- back image URL
- status
- featured rank
- IMDb id
- alternate identifier
- metadata source
- metadata status
- estimated value low/high cents
- estimated value currency
- rarity notes
- collection notes
- value search URL

## Product intake expectations
- Mobile product entry must support partial drafts before later mandatory fields are enforced.
- The repo should include and maintain a detailed finished-products CSV import template for bulk additions.

## Known honest remaining gaps
- Trusted movie enrichment still depends on the external/local enrichment pipeline and cannot be truthfully marked fully complete inside the site repo alone.
- Broader permission granularity and deeper security segmentation remain future security-pass work, not something already solved.
- Some legacy admin/read paths may still need more API-first authority cleanup.

## Recommended next actions in a new chat
- Verify `functions/api/admin/movies.js` in a live environment against an older D1 database and confirm the auto-add column path covers every missing movie field.
- Continue the Known Gaps list from the remaining repo-safe items.
- Keep docs aligned with the JSON-first movie truth and overlay-only D1 strategy.
- Continue reducing duplicate truth paths between JSON, D1, and admin screens where the repo can do so honestly.


## Current pass addendum
- Marked the previous admin preview, products fallback, movie save, and accordion issues as completed/fixed in the documentation.
- Departmentalized Admin into standalone interfaces: Members, Catalog, Orders, Accounting, Analytics, Operations, and Movies, reducing the size and risk of the main dashboard file.
- Added real starter routes/UI for tier policy, general ledger accounts, expenses, write-offs, product unit costs, and monthly accounting CSV export.
- Added accounting templates (CSV + XLSX) so GL and month-end bookkeeping can be seeded faster.
- Continued mobile direction by making the lighter departmental pages easier to use on smaller screens than the former all-in-one Admin page.
- Continued JSON-to-DB convergence by moving tier policy and accounting records into D1-backed tables instead of temporary page-only assumptions.


## Current pass addendum
- Fixed the Members department so Access Tiers render as a visible standalone interface instead of only a hidden modal dependency.
- Rewired Tier Policy admin/member JSON contracts so the admin editor and member account views use the same DB-backed field names.
- Strengthened the Accounting department with visible starter forms plus month-end, quarter-end, and year-end CSV export presets.
- Added a new phone-first Admin Dashboard at `/admin/mobile/` with Today, Quick Add, receiving, and export-oriented shortcuts.
- Continued moving the admin shell toward dashboard-style department buttons instead of long scroll-heavy interfaces.


## Current pass status
- Departmental admin pages remain the active direction and the lighter launcher dashboard is still the preferred shell over a single long admin page.
- Accounting now has clearer quick-action launch points and export preset entry points, especially for phone use.
- Mobile-first work should continue by moving more common daily actions onto the phone dashboard before broader stress testing.


## Current pass addendum
- Replaced the long phone Admin link list with a grouped tree-style mobile menu so the phone workflow uses collapsible sections instead of one uninterrupted list.
- Continued mobile-first workflow tuning by surfacing Today, quick expense, quick write-off, product cost, and export actions closer to the top of the phone dashboard.
- Continued docs/current-build synchronization for the present mobile-navigation and admin-usability pass.


## Current pass addendum
- Customer-facing home/shop flow was made friendlier and clearer on phone and desktop with stronger exploration sections and clearer action cards.
- Accounting moved forward with monthly overhead allocations and a rough net-after-overhead view in the accounting report so operating costs can start flowing toward fuller P&L reporting.
- Mobile admin moved forward again with a direct overhead-allocation shortcut from the phone dashboard.
- Schema and template files were updated for the new overhead allocation layer.


## Current pass update
- Fixed the missing phone-draft continuation gap by adding a draft picker to the mobile product capture screen and update-in-place draft saves.
- Added an estimated item-costing accounting view so rough full unit cost can include direct costs, linked resources, and allocated overhead.
- Mobile admin quick links now expose item-costing review directly from the phone dashboard.
