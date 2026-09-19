# Release 467 Build 195 — Sitewide Media Studio Runtime & Carousel Recovery

## Trigger and starting boundary

This corrective build starts from exact Production-GREEN Release 467 Build 194:

- Production `main`: `8bfd3902fb95146edadde59f653ecbebd13fb9ed`.
- Accepted Build 194 Development: `29a13aa11044c9b85795f860525a7c6f2959129c`.
- Build 194 Production Pages Deploy: `35443914553` — SUCCESS.
- Build 194 Production Live Resource Integrity: `35443944678` — SUCCESS.
- Build 194 optimized Development evidence: Inventory **9,821** rows-read; Media **9,967** rows-read.

Owner acceptance after that release reported two release-blocking symptoms:

1. the Home carousel and its placeholder/fallback stopped working; and
2. non-product studio, process, proof, banner, background and engagement images still could not be reliably changed across the application.

Build 195 therefore takes priority over the previously planned Buyer Readiness work. That work moves to Build 196; no planned roadmap scope is discarded.

## Confirmed root causes

### 1. Carousel authority regression

Build 194 made a Media Studio Home-hero override suppress the published Home carousel. A custom Home hero must instead become the carousel's **fallback image**. Published carousel slides remain the active carousel authority when available.

### 2. Catalog/D1 slot drift

The deployed slot catalog contains newer placeholders and presentation locations that can be absent from `media_content_slots`. Media Studio could detect this drift but only displayed an obsolete “apply Build 259 migration” warning; it never invoked its existing bounded `register_slots` authority.

Build 195 reconciles only missing or structurally drifted definitions when an administrator opens that exact Studio page. Existing assignments are preserved.

### 3. Responsive `<picture>` authority

Changing only an `<img src>` does not replace a responsive `<source srcset>`. On narrow screens the authored `<source>` can therefore continue to win. Build 195 makes an explicit Media Studio assignment authoritative across the whole `<picture>`.

### 4. Placeholder presentation residue

After a real assignment, the old `data-media-placeholder`, placeholder frame class and “Site image placeholder” caption could remain. Build 195 clears that placeholder-only presentation state when the assigned image is applied.

### 5. Background editability and stale runtime cache keys

Public admin edit mode exposed image slots but not `data-media-background-slot` locations. Also static pages carried multiple old media-runtime cache keys. Build 195 exposes background editing and advances every page that loads the shared runtime to `v=467b195`.

## Acceptance contract

- Published Home carousel slides run even when Media Studio has assigned a custom Home fallback image.
- If no published carousel slide is available, the Media Studio-updated Home hero is retained as the visible fallback.
- Media Studio reconciles only missing/drifted catalog slot definitions for the exact page opened by an authenticated administrator.
- Reconciliation does not replace or remove an existing media assignment.
- Explicit image assignments override responsive `srcset` sources.
- A real assignment removes placeholder-only visual state.
- Background image locations are reachable from public admin edit mode.
- Admin refresh requests use a no-store public manifest response.
- Every HTML page loading `media-content-runtime.js` uses `v=467b195`.
- Home and Media Studio use the Build 195 carousel/runtime/editor cache keys.
- Product, Inventory, Supplies and Tools media remain owned by their specialist workflows.
- No schema migration.
- No automatic Product/Inventory/customer mutation.
- No automatic R2 list, put or delete.
- No payment, accounting, provider-publication or external-lane action.
- Production promotion remains code-only and uses the zero-D1 migration path.

## D1/R2 boundary

The only D1 mutation introduced by this corrective flow is an authenticated, bounded upsert of static presentation **slot definitions** when the deployed catalog and D1 disagree for the page an administrator explicitly opens. It is not Product, Inventory, customer, payment or accounting data. Assignment itself remains a separate explicit owner action.

There is no automatic media assignment and no R2 mutation in reconciliation.

## Roadmap

After Build 195 is fully Development and Production GREEN:

- Build 196 — Buyer Readiness Repair Workbench.
- Build 197 — Supplier & Source Evidence Workbench.
- Build 198 — Cycle Count & Duplicate Identity Resolution.
- Build 199 — Catalog Reference & Media Reconciliation.
- Build 200 — Cost Evidence & Margin Readiness.
- Build 201 — Storefront Launch Set & Autonomous Closure.
