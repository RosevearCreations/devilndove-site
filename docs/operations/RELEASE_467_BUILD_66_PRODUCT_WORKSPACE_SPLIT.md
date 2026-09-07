# Release 467 Build 66 — Product Workspace Split

Build 66 starts from the exact fully-green Build 65 Production/Development source boundary:

- base SHA: `32e7d20e8f2c26463abe6bb44d5e34ecca5aa5bc`
- base tree: `de433f7c3b82108d68e87891b53d1367f97abf74`
- canonical D1 migration authority: `0001`–`0004` only

## Purpose

The Products Admin page had become one long surface containing catalog rows, editor fields, inventory links, media, SEO/publishing systems, cleanup, archive/correction guidance, and several secondary Product tools. Build 66 splits that presentation into focused workspaces while preserving **one Product authority** and the existing Product id/event contracts.

## Product workspaces

The Products page now exposes six keyboard-accessible workspaces:

1. **Products** — catalog list, QA, pricing, offers, and general Product actions.
2. **Editor** — create/edit the shared Product record.
3. **Inventory Links** — materials, tools, Product resource links, and stock context.
4. **Media** — Product images, annotations, media library, and photography systems.
5. **SEO / Publishing** — Product SEO, story notes, and catalog synchronization.
6. **Cleanup / Archive** — duplicate cleanup, lifecycle guidance, correction, archive, and safe removal review.

The workspace state is reflected in the `workspace=` query parameter so a focused view can be bookmarked or restored without creating separate Product routes or separate data authorities. Arrow-key, Home, and End navigation are supported across the workspace tabs.

## One Product authority

`public/js/admin-product-workspaces.js` is presentation-only. It does not call Product APIs, D1, R2, provider endpoints, or payment/publication systems. Existing mounts are moved into focused panels while keeping their original DOM ids and their existing `dd:product-editor-target`/Product event contracts.

A small read-only authority indicator follows the currently loaded Product id/name so the operator can see that Editor, Inventory Links, Media, SEO / Publishing, and Cleanup / Archive are all acting on the same Product authority.

Direct Product-table edit actions route to **Editor**. Correction/removal actions route to **Cleanup / Archive** after the existing Product load/preflight path begins. No duplicate Product record is created by changing workspaces.

## Build 65 compatibility

Inactive workspaces stay in the DOM so existing mounts keep stable identity, but they are `hidden` and `inert`. `public/js/admin.js` now teaches the Build 65 near-viewport helper to treat hidden/inert ancestors as not visible. This prevents optional Product modules from becoming eager merely because their mount exists inside an inactive Build 66 workspace.

The core module/permission authority remains eager exactly as before.

## Authority boundary

Build 66 is schema-neutral and presentation-only:

- canonical D1 migration stream: unchanged (`0001`–`0004`)
- D1 business-data mutation: **NONE**
- R2 mutation: **NONE**
- provider execution/publication: **NONE**
- Product API authority: unchanged
- Production promotion: only after the exact Development SHA is fully green

## Acceptance

Build 66 is accepted only when the exact Development SHA passes the current System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development deployment/smoke acceptance, Build 62–65 carried-forward contracts, and the Build 66 Product Workspace source contract.

Production may then be promoted only by non-force fast-forward of that exact fully-green Development commit.

## Next planned build

After Build 66 is fully green and promoted, continue with **Build 67 — Product Editor Recovery & Autosave**.
