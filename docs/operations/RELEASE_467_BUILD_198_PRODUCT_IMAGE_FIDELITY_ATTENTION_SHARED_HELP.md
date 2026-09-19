# Release 467 Build 198 — Product Image Fidelity, Actionable Attention & Shared Online Help

## Trigger and exact starting boundary

Owner review of Production-GREEN Build 197 identified three cross-application usability gaps:

1. Product photos that meet upload specifications were still being visually cut off in Shop cards because the Storefront forced them through `object-fit: cover`.
2. **Today Needs Attention** showed aggregate state and threshold counts before clearly telling the operator what failed, where it failed, how old it was, and which workspace owns the follow-up.
3. Devil n Dove already had an accessible contextual-help primitive, but it was primarily Admin-oriented rather than a shared user / creator / administrator help system.

Build 198 starts from:

- Build 197 Development: `fbec823e33d0bed910b509c9501c092066632abe`.
- Build 197 Production `main`: `4ee71f0d20849f486618e8d39648acf637f111f3`.
- Production Pages Deploy #213: SUCCESS.
- Production Live Resource Integrity #192: SUCCESS.
- Product route/browser Production proofs #75 / #67: SUCCESS.
- Exact Build 197 Production workflows: 14/14 GREEN.

## Product image fidelity contract

Buyer-facing Product media shows the complete uploaded image by default.

The following Product surfaces use `object-fit: contain` and centered presentation:

- Shop card primary image;
- Shop card thumbnails;
- Product detail primary image;
- Product detail thumbnails.

Portrait and landscape uploads may therefore show intentional empty space inside a standardized card frame. That space is preferable to silently cutting off the Product.

Collection/collage presentation is a different merchandising surface and may retain deliberate `cover` behavior.

### Explicit editing remains authoritative

The existing Product Media & Image Editor continues to own:

- add / replace / remove;
- gallery order;
- **Keep original**;
- explicit square / landscape crop presets;
- resize-max-side;
- image role and public-use status;
- alt/title/caption/notes;
- focal point;
- featured image;
- image score.

Build 198 adds a visible focal-point marker. Clicking the selected-image preview updates focal X/Y in the editor; the operator must still save the selected image details.

A focal point is metadata for intentional presentation/derivative work. It does **not** silently crop the Storefront image.

## Today Needs Attention contract

The existing runtime-incident API already returns the evidence needed to make operational attention understandable without another D1 read:

- incident scope;
- incident code;
- endpoint path and method;
- message;
- created time / calculated age;
- severity and review status;
- read-only recovery descriptor where supported.

Build 198 turns that evidence into an operator-first view:

- **What** — incident message plus scope/code;
- **Where** — method + endpoint;
- **Age** — hours open;
- **Owner** — direct link to the responsible workspace;
- **Safe recheck** — only when the existing allowlisted read-only recovery descriptor supports it.

Threshold keys are translated into human-readable labels. Recurring groups now show What, Where and Owner instead of requiring the operator to decode internal keys before knowing where to investigate.

No incident is auto-resolved, auto-ignored or bulk-cleared.

## Shared online help contract

Build 198 extends the existing accessible contextual-help implementation rather than creating another tooltip system.

The shared system provides:

- a compact circular `ⓘ` button adjacent to methods, terms and controls;
- keyboard-focus support;
- truthful `aria-expanded` / `aria-controls`;
- Escape-to-close;
- one explanation open at a time;
- local help text without leaving the workflow;
- a floating **ⓘ Help** link;
- public/member Help Centre at `/help/`;
- admin/creator operating Help Centre at `/admin/help/`.

Initial shared vocabulary includes:

- Shop by intent and Advanced Product Search;
- Product details, full Product image display, purchase/cart, wishlist/back-in-stock;
- Product Media, crop/resize, focal point, image score and public-use status;
- Media Studio, Content Studio, Creative Projects and Packaging Studio;
- Today Needs Attention, recurring incidents, runtime incidents, severity and review state;
- retained Storefront, Inventory, Supplies, Tools, Accounting, I.T., security, SEO, responsive and release terminology.

The contextual-help client remains explanatory only. It performs no fetch/API request, D1/R2 mutation, purchase, payment, publication or provider action.

## Performance boundary

Public pages receive the same client-only help implementation through the shared HTML middleware. Public help does not start a whole-document MutationObserver.

Admin routes receive the same module through the authenticated UI bootstrap. Lean Admin workspaces receive the initial help pass without enabling the optional bounded observer. Non-lean dynamic Admin workspaces retain the existing bounded 8-second observer and can request a refresh through `dd:admin-context-help-refresh`.

The Storefront discovery stylesheet/runtime uses a new Build 198 asset revision so browsers cannot keep the prior automatic-cover CSS from cache.

## Safety boundary

- No schema migration.
- No request-time DDL.
- No Product, Inventory, customer, accounting or order data migration.
- No automatic image crop or derivative creation.
- No automatic R2 list, upload, replacement or deletion.
- No incident status mutation unless an administrator explicitly invokes the existing review/recovery action.
- No payment, provider, OAuth or publication execution.
- Production promotion remains code-only and uses the zero-D1 migration path.

## Acceptance

- Buyer-facing Product primary/thumbnail selectors are explicitly `contain`.
- Collection/collage media may remain `cover`.
- Product Media gallery/editor previews show the full image.
- Crop/resize remains an explicit operator action and Keep original remains available.
- Focal point has a visible interactive editor marker and persists only after Save.
- Today Needs Attention exposes What, Where, Age and Owner for individual incidents.
- Recurring incident groups expose What, Where and Owner.
- Threshold keys are human-readable.
- Existing safe-recheck and review-state safety remains intact.
- The same accessible `ⓘ` implementation serves public, creator and Admin surfaces.
- Public and Admin Help Centres each retain one H1.
- Shared help is client-only and mutation-free.
- Build 197 placeholder integrity and Build 196 Media Studio placement protections remain intact.
- Build 199 — Buyer Readiness Repair Workbench — remains next after Build 198 is fully GREEN.
