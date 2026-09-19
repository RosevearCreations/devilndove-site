# Release 467 Build 198 — Storefront Media Fit, Actionable Attention & Contextual Help

## Trigger and exact starting boundary

Owner acceptance after Production-GREEN Build 197 identified three cross-application usability failures:

1. Product photography was uploaded to the required specification, but Storefront Product cards forced the image through square `object-fit: cover` framing and silently cut off valid image content.
2. **Today Needs Attention** exposed counts and raw threshold codes without making the actual problem, affected area/endpoint, and owning workflow easy to understand.
3. The application had a static Admin Help Centre and specialist external-provider field help, but not a reusable contextual Online Help system for public users, administrators and creators.

The supplied acceptance screenshot also showed a Product Details shell remaining on **Loading product...**, so this build adds a bounded client fail-safe in addition to retaining the existing eight-second Product API timeout.

Build 198 starts from:

- Build 197 Development: `fbec823e33d0bed910b509c9501c092066632abe`.
- Build 197 Production `main`: `4ee71f0d20849f486618e8d39648acf637f111f3`.
- Production Pages Deploy #213: SUCCESS.
- Production Live Resource Integrity #192: SUCCESS.
- Products Route Production Proof #75: SUCCESS.
- Products Production Browser Proof #67: SUCCESS.

## Product image presentation contract

The authoritative uploaded Product image is shown in full by default.

- Shop Product cards use a consistent square presentation **frame**, but the image itself uses `object-fit: contain`.
- Shop thumbnails and Product Detail thumbnails also use `contain`.
- Product Detail main images retain `contain` and a bounded viewport height.
- Collection/collage merchandising imagery may retain deliberate `cover` presentation because those are discovery compositions, not the authoritative Product photo frame.
- Storefront display does not infer a crop from card shape.
- Existing Product Media / Photo Studio focal point, crop, derivative, replace and gallery-order controls remain the place for deliberate image composition changes.
- The original source image remains authoritative unless an operator explicitly saves an edited/replacement derivative through Product Media.

## Product Details fail-closed startup

The existing lean Product Detail renderer already uses a bounded eight-second request timeout and hides the loading indicator in `finally`.

Build 198 additionally:

- advances the Product Detail client cache key;
- adds a ten-second page-level watchdog;
- replaces an otherwise persistent loading shell with a visible recovery message;
- does not add retries, duplicate Product requests or background polling.

## Today Needs Attention contract

Operational attention must answer:

- **What happened?**
- **Where did it happen?**
- **Which owning workspace should I open?**
- **What is the technical code/endpoint if I need deeper evidence?**

Threshold breaches now carry a human label, explanation, location, owner link and owner label. In particular, `stale_open_72h` explains that its count covers the unresolved runtime backlog rather than only the current Days filter.

Grouped recurring incidents render as responsive cards rather than requiring horizontal table scrolling to discover Scope, Code and Endpoint. Individual incident records retain technical evidence and safe-recovery controls.

Owner routing is evidence-derived from the incident scope/code/endpoint and is limited to existing workspaces such as Product Media, Inventory Operations, Orders, Accounting, Content Studio and I.T.

## Contextual Online Help contract

A new shared help system provides:

- a fixed **ⓘ Help** entry point on HTML application pages;
- reusable circular `i` controls beside recognized methods, fields, headings and processes;
- explicit `data-dd-help-key` hooks for important workflows;
- a searchable accessible dialog with `role="dialog"`, `aria-modal="true"`, Escape-to-close and focus restoration;
- role-aware topic visibility for public users, administrators and creators;
- the three standard explanations **What is this?**, **How do I use it?**, and **What happens if I change or use it?**;
- a MutationObserver so dynamically rendered Admin/Creator interfaces can receive contextual help after page load;
- direct links back to the owning application workspace;
- coexistence with the existing Release 461 specialist external-provider/credential help.

The shared Pages middleware injects the help CSS/client into HTML responses so help coverage is not dependent on each page carrying the newest `main.js` query string. `main.js` and `admin.js` also load the module as compatibility/fallback paths; the help runtime has an idempotent bootstrap guard.

The Admin Help Centre now includes dedicated guidance for contextual help, Product image framing/crop, Today Needs Attention, and Creator/content workflows.

## Safety boundary

- No schema migration.
- No request-time DDL.
- No Product image mutation.
- No automatic crop, derivative generation, replacement or recentering.
- No R2 upload, list, overwrite or delete.
- No Product/Inventory/customer/accounting business-data mutation.
- No automatic incident resolution or provider retry.
- No payment/refund/provider action.
- Existing Stripe, PayPal and Social/OAuth HOLD states remain unchanged.
- Production promotion is code-only and uses the zero-D1 migration path.

## Acceptance

- Storefront Product cards show the complete source image with `object-fit: contain`.
- Legacy Storefront/Product CSS cannot silently restore Product-image `cover`.
- Collection/collage cover behaviour remains intentionally separate.
- Explicit Product Media crop/focal/derivative controls remain present.
- Product Detail cannot leave the browser on an indefinite Loading product shell.
- Today Needs Attention presents What, Where, owner action and technical evidence.
- `stale_open_72h` is explained in human language.
- Context help is middleware-injected sitewide, searchable, accessible and role-aware.
- Public, Admin and Creator help topics exist.
- Existing external-provider field help remains intact.
- Build 197 placeholder integrity remains GREEN.
- Build 199 remains the Buyer Readiness Repair Workbench after Build 198 is fully GREEN.
