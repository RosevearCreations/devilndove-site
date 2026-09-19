# Release 467 Build 197 — Sitewide Placeholder Integrity & Cycling

## Trigger and exact starting boundary

Owner acceptance on Production-GREEN Build 196 showed that placeholder editing still differed by location: the first two of three Home placeholders could be saved, while the remaining placeholder did not behave reliably.

Build 197 starts from:

- Build 196 Development: `733fd6d765cbb165d3833e426593b0da8a4d8e51`.
- Build 196 Production `main`: `8c41e361ad5bdbbabf9fc2f6d8b16f8a01f5b872`.
- Production Pages Deploy #212: SUCCESS.
- Production Live Resource Integrity #191: SUCCESS.
- Exact Cloudflare Pages Production deployment: SUCCESS.

## Source audit

The current public/static presentation source contains **29 SVG image placeholders across 22 public pages**.

The Home page contains the three owner-reported placeholder locations:

- `home.what.visual.2`
- `home.what.visual.3`
- `home.section.visual.1`

The audit found:

- no duplicate placeholder slot keys in HTML;
- seven catalog placeholder visuals were found missing the HTML placeholder marker; six hero slots were normalized and the missing Collections section placeholder was rendered;
- one matching slot-catalog definition for every placeholder;
- no catalog placeholder definition without a corresponding HTML placeholder;
- every placeholder catalog row uses an image slot and an exact `[data-media-slot="..."]` selector;
- each placeholder page loads the shared Media Studio public runtime.

## Corrective behavior

1. Media Studio derives the complete placeholder set from the deployed slot catalog when the authenticated Studio starts.
2. It sends one bounded placeholder-integrity request covering no more than 100 definitions.
3. The server reads only public/static image-slot definitions, compares them to the supplied catalog contract, and upserts **only missing or structurally drifted placeholder definitions**.
4. Existing media assignments are never replaced by placeholder reconciliation.
5. The Studio shows a sitewide Placeholder readiness status before normal editing.
6. Historical duplicate active assignments are reported. They are not guessed away automatically; when the owner explicitly saves a replacement, the Build 196 assignment path normalizes that exact slot to one authoritative image.
7. Every assignment request now carries both the numeric slot ID and the expected stable `page_path + slot_key`. A mismatch fails closed before any placement mutation.
8. Product, Inventory, Supplies and Tools image authorities remain unchanged.

## Safety boundary

- No schema migration.
- No request-time DDL.
- No automatic image selection or image replacement.
- No R2 list, upload, replacement or deletion is performed by placeholder reconciliation.
- No Product, Inventory, customer, payment or accounting data is changed.
- The only automatic D1 mutation is an authenticated Media Studio repair of a missing/drifted **static presentation slot definition**; unchanged definitions are read-only.
- Existing image assignments are preserved.
- Duplicate active assignments are surfaced, not resolved by guessing which historical image should win.
- Production promotion remains code-only and uses the zero-D1 migration path.

## Acceptance

- Source audit remains exactly 29 placeholders across 22 pages until a deliberate source/catalog change updates this contract.
- All three Home placeholder keys are present and unique.
- HTML and catalog placeholder inventories match bidirectionally.
- Media Studio reconciles all placeholders before page-by-page editing begins.
- Reconciliation is bounded to public/static image placeholders.
- Save requests verify expected page path and slot key before mutation.
- Build 196 exactly-one-active-assignment verification remains intact.
- Media Studio cache key advances to `v=467b197`.
- Build 198 remains the next Buyer Readiness Repair Workbench after Build 197 is fully GREEN.
