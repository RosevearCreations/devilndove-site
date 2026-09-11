# Release 467 Build 97 — Product Readiness Work Queue & Blocker Navigation

## Purpose

Build 97 starts from the externally proven Build 96 Development and Production checkpoint at exact SHA `ba0e2f633d823b90fdcc2cbbbe6be4c50c79b284`, tree `76f01771b844f6f610a621cd969d033cfa3d7c9c`.

Development proof:
- System Gate `34546959255` — SUCCESS
- Current Application Quality `34546959190` — SUCCESS
- I.T. Admin Runtime Proof `34546959188` — SUCCESS
- Repository Branch Hygiene `34546959296` — SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only Development data authority, Preview binding proof, non-secret smoke and regression evidence — SUCCESS.

Production proof:
- Production Pages Deploy `34547083100` — SUCCESS
- Production Live Resource Integrity `34547157869` — SUCCESS.

Build 97 ingests that exact closure before changing the Products surface.

## Readiness work queue

The Products page already loads one Product readiness preview through the primary Product runtime. Build 97 does **not** add another readiness request. The primary Product script already renders each readiness result and its existing **Open first blocker** action into the Product row. The Product enhancement layer reads that rendered projection and reuses the existing blocker action, so no second Product or readiness API/database read is introduced.

The Product browser now adds a **Readiness work queue** that:

- lists blocked Products using the existing rendered readiness result;
- prioritizes the lowest readiness score first so the most incomplete Product is visible first;
- shows Product number/name, readiness score, first blocker label and help text;
- provides a direct **Open blocker** action that delegates to the existing Product-row blocker action and therefore retains the same image / SEO / price / description / readiness corrective routing;
- provides **Show Product row** to clear browser filters and move explicitly to the Product record;
- stays read-only and never changes Product, Inventory, R2, provider, or publication state.

## Readiness focus views

Build 96 search/focus behavior remains intact. Build 97 extends the focus set with:

- **Readiness blocked** — Products for which the existing rendered readiness preview reports `Blocked`;
- **Ready** — Products for which the existing rendered readiness preview reports `Ready`.

Readiness focus buttons expose live counts, use `aria-pressed`, and combine with Build 96 text search. Products with unavailable readiness evidence are never silently classified as ready.

## Retained Product ergonomics

Build 96 remains authoritative for browser-local Product text search, Needs attention / Drafts / Low stock / Missing lead image focus views, explicit Show current Product recovery, and the no-second-Product-API boundary. Build 95 remains authoritative for current Product context, sticky table identity/header behavior, and Essential / Full column views. Build 94 responsive workspace navigation and Build 93 shell/overflow protections remain intact.

## Release and data safety

Build 97 adds no D1 schema change, canonical migration, request-time DDL, Product or Inventory business-data migration, R2 mutation, provider execution, provider publication, Cloudflare Access mutation, or automatic Production promotion. Canonical D1 migrations remain exactly `0001`–`0004`.

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative; U.S. sales/shipping remain disabled and local pickup remains supported.

## Closure protocol

Build 97 is a closure candidate and may not self-record its later exact-head proof. The exact final `dev` SHA must independently pass System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1/read-only/bindings proof, exact Preview deployment and smoke. Only that exact tree may be promoted to `main`. Production must then independently pass the standard business-data-preserving Pages deployment chain and Production Live Resource Integrity proof. Build 98 will ingest that final external Build 97 evidence.
