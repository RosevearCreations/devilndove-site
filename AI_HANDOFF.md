# Devil n Dove AI Handoff — Build 221

## Read these two files first
1. `AI_HANDOFF.md` — current architecture, safety boundaries, deployment requirements and active workflows.
2. `PROJECT_STATUS_AND_ROADMAP.md` — launch status, completed Build 221 actions, current risks and the next 20 steps.

Specialist reference: `PACKAGING_STUDIO.md`. Historical build notes must not override this canonical pair.

## Build 221 outcome
Build 221 concentrates on operational cleanup, packaging and lot traceability:

1. **Draft & Archive Cleanup Centre** — `/admin/products/` now has a visible, searchable cleanup panel for both draft and archived products. A preflight separates disposable product-owned working rows from protected order, payment, reservation, content, accounting and customer history.
2. **Corrected deletion classification** — product-owned draft records such as images, SEO, tags, resource links, offer rows, QA rows and story working rows no longer block the cleanup routine merely because their foreign key is not cascading. Unused recipe/material links can be discarded without changing stock; rows that may involve reserved stock still require the full review. Older non-FK product references are now discovered explicitly, and protected order, accounting, project, packaging, customer-story, recall and public-proof history still blocks deletion.
3. **Packaging Studio** — `/admin/packaging-studio/` stores structured bilingual packaging projects, reusable SVG templates, review versions and export history in D1.
4. **Supplied soap-ribbon template** — the first preferred template recreates the photographed structure with a narrow 19 mm band, extended scalloped badge, curved collection/scent text, bilingual centre title and botanical side ornaments. The full 50 mm canvas prevents badge clipping.
5. **Lot reconciliation controls** — purchase-lot totals can be compared with main on-hand stock, reviewed without changing stock, or deliberately applied using typed confirmation and an audited inventory movement. FIFO/FEFO are stored as preferences only; automatic depletion is not enabled.

## Deployment
Apply either the dedicated migration or the reset current-pass file (not both):

`database_build221_packaging_studio_cleanup_lot_controls.sql`

or `database_upgrade_current_pass.sql`, which contains the same Build 221 upgrade only.

Then deploy the complete ZIP. It is additive and must follow Build 220. Runtime guards create the same minimum tables, but production D1 should still receive the migration deliberately.

## New or changed endpoints
- `GET/POST /api/admin/packaging-studio`
- `GET/POST/DELETE /api/admin/inventory-lots` now includes lot policy and reconciliation actions.
- `GET/POST /api/admin/delete-product` now classifies product-owned working records separately from protected business history.
- `POST /api/admin/archive-product` now uses the shared DB resolver, audit trail and incident fallback, then directs the product into the Archived cleanup filter.

## New admin surfaces
- `/admin/packaging-studio/`
- Draft & Archive Cleanup Centre inside `/admin/products/`
- Lot reconciliation panel inside Tools & Supplies purchase lots.

## Packaging safety boundaries
- Packaging content is a draft until formula, INCI, bilingual identity, metric quantity, dealer/contact details, warnings, claims and physical print have been reviewed.
- Browser export is not regulatory approval.
- A saved Packaging Studio version does not update the product page or publish media.
- The supplied photo is a layout reference; editable text and colours are recreated as SVG rather than embedding the photograph.
- The dealer principal address is intentionally required by the Packaging Studio common-field preflight.

## Product deletion safety boundaries
- Permanent deletion is only for unused incorrect drafts or unused archives.
- Product numbers and SKUs remain retired after deletion.
- Any true historical reference blocks deletion and requires Archive.
- Product-owned working rows are removed in the same reviewed operation.
- Linked material rows require the existing Correct / remove workflow when reservation release or physical stock return needs review.
- R2 objects are not automatically deleted because media may be reused elsewhere.

## Lot reconciliation safety boundaries
- Adding or editing a lot marks reconciliation `needs_review`.
- **Record review only** creates evidence without changing main stock.
- **Apply lot total to main on-hand** requires `APPLY LOT TOTAL`, records before/after quantities and creates a movement where the movement table exists.
- FIFO/FEFO are policy preferences only. Automatic lot selection and lot-level consumption remain future work.

## SEO and UI rules
- Every public and admin HTML file currently has exactly one H1.
- Admin Packaging Studio is `noindex,nofollow`.
- Continue descriptive titles, one clear main heading, crawlable descriptive links, visible buyer wording and truthful local Southern Ontario relevance.
- Do not create public thin pages for each package template or scent unless they provide unique buyer value.

## Current launch-critical limitations
Payment/inventory settlement, refund restoration, concurrency/oversell proof, production email delivery, shipping/tax verification, backup restore rehearsal and social OAuth remain launch gates. Packaging Studio and cleanup do not remove those requirements.

## Validation
Follow `BUILD221_VALIDATION.md`. The migration, delete preflight, photo-reference SVG, version/export workflow and lot reconciliation must be tested against a staging D1 backup before production use.
