# Release 467 Build 99 — Product Work Views & Browser Sort

## Starting authority

Build 99 starts from externally proven Build 98 at exact SHA `81d6ed5cdd55c959611f538de8c90bcf21f5b302`, tree `d19224681ade25301c07d96854c0b6c7a6abd762`.

Development proof:
- System Gate `34550999431` — SUCCESS
- Current Application Quality `34550999419` — SUCCESS
- I.T. Admin Runtime Proof `34550999479` — SUCCESS
- Repository Branch Hygiene `34550999409` — SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only Development data authority, Preview bindings, non-secret smoke and regression evidence — SUCCESS.

Production proof:
- Production Pages Deploy `34551114694` — SUCCESS
- Production Live Resource Integrity `34551173009` — SUCCESS.

## Purpose

Build 98 made readiness work easier to triage by blocker type. Build 99 lets an operator preserve a useful Product-browser setup and return to it later without changing Product records or introducing a new server-side view authority.

## Browser-local saved work views

A saved Product work view captures:
- Product search text;
- active Product focus filter;
- active readiness triage group;
- visible-column preferences;
- current browser row sort.

Up to eight named work views are stored in `localStorage` under `dd_catalog_work_views_v1`. Saving an existing name updates that browser-local view. Applying a view drives the existing Build 98/96/95 controls, and deleting a view removes only that browser preference. No Product record, readiness record, D1 row or R2 object is changed.

## Browser row sort

The current browser can order already-rendered Product rows by:
- original Product order;
- Product/System number ascending or descending;
- Product name A–Z or Z–A;
- readiness score lowest or highest first;
- inventory quantity lowest first;
- most recently updated first.

The selected sort is browser-local under `dd_catalog_work_sort_v1`. Sorting reuses the shared Product snapshot `dd_admin_products_snapshot_v2` plus readiness already rendered by the primary Products loader. Reset row order returns to the original snapshot order.

## Preserved Product authority

Build 99 does not replace any existing Product workflow. Build 98 readiness triage, Build 97 readiness queue/navigation, Build 96 search/focus, Build 95 current Product context/sticky table/column controls, Build 94 responsive Product workspace navigation and Build 93 centered-shell/right-side reachability remain active.

The work-view layer adds no `/api/` call, no `apiFetch`, no direct `fetch`, and no Product/readiness database read. It does not edit, approve, publish, archive, delete or otherwise mutate a Product.

## Data and release safety

Canonical D1 migrations remain exactly `0001`–`0004`. Build 99 adds no D1 schema change, request-time DDL, Product/Inventory business-data mutation, R2 mutation, provider execution/publication, Cloudflare Access mutation or automatic Production promotion.

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported.

## Closure protocol

Build 99 is a closure candidate and cannot self-record its future exact-head proof. Its final `dev` SHA must independently pass System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1/read-only/bindings proof, exact Preview deployment and smoke. Only that exact SHA/tree may be promoted to `main`, followed by Production Pages Deploy and Production Live Resource Integrity. Build 100 must ingest Build 99's external final closure.
