# Release 467 Build 163 — Product Editor & Media Low-Read Rewrite

## Purpose
Build 163 completes the Product Admin architecture reset begun in Build 162. The Product Browser, single-Product editor, Product Media workspace, image editor and scoring path are separated so that opening one Product does not wake catalog-wide, inventory, readiness, content, R2-library or quality-scanning systems.

## Runtime contracts

### Product Browser
- Bounded Product list only.
- Direct Edit links open `/admin/product-editor/?product_id=<id>`.
- No embedded editor or media subsystem.

### Product Editor
- Startup reads one Product plus its SEO row.
- Save is explicit; there is no autosave or background retry loop.
- Save updates only the selected Product and selected Product SEO row.
- Product media, inventory, readiness, resource costing and content automation are not started by editor startup or save.

### Product Media / Image Editor
- Media workspace requires a selected `product_id` before any Product gallery read occurs.
- The selected Product gallery is bounded to 20 rows.
- Opening Catalog Media with no Product selected performs zero Product-media D1 reads.
- R2 is not listed to render a Product gallery. Existing Product image URLs use the direct same-origin R2 transport.
- Image detail/scoring is lazy and selected-image only.
- Scoring is an explicit button action, never an automatic gallery sweep.
- Primary-image thresholds remain 1200×1200 minimum dimensions, alt text length 12+, score 70+.

## D1 protection
- No request-time CREATE/ALTER/DROP/PRAGMA schema repair in the new current Product paths.
- New endpoints rely on the Admin route guard context rather than re-reading the session/user tables inside each endpoint.
- No broad Product catalog, `media_assets`, Product resource, content-project, creative-project or R2-library scan is permitted by the Build 163 current Product editor/media paths.
- Read-count headers are returned by the new Product APIs so browser evidence can show the selected operation's bounded D1 contract.

## Acceptance
Source acceptance is owned by `scripts/release467_build163_gate.py` and `.github/workflows/release467-build163-product-admin-low-read.yml`. The proof is source-only and performs no D1, R2 or provider mutations.
