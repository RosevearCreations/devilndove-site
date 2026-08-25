# Devil n Dove — Rolling Next 20 Builds

Updated 2026-08-25 after staging the 10-build Custom Requests read-surface batch (Builds 373–382).

## Cadence rule

Work in **10-build execution batches**. Keep the next **20 builds** visible here so two full batches are always queued behind the current work.

This file is a rolling plan, not permission to ignore validation findings. A browser/local failure may insert a bounded correction build and shift later numbers. Production remains frozen unless separately promoted.

## Current execution batch — Builds 373–382

| Build | Target | Outcome |
| --- | --- | --- |
| 373 | Custom Requests marketplace CSV | Add non-mutating CSV export over already-prepared packs. |
| 374 | Marketplace export readiness | Add read-only schema/readiness contract; no preset seeding. |
| 375 | Dedicated page diagnostics bootstrap | Read Build 370 startup contract from the dedicated page. |
| 376 | Safe export toolbar | Add explicit all/Etsy/Facebook/Pinterest/manual safe downloads. |
| 377 | Legacy CSV-link rewrite | Rewrite old `?format=marketplace_csv` links on `/admin/custom-request/`. |
| 378 | Startup schema visibility | Show Build 370 checked/missing startup tables in-page. |
| 379 | Export schema visibility | Show export-pack and optional marketplace-preset readiness in-page. |
| 380 | Dedicated-page guard | MutationObserver/capture guard prevents the old CSV GET from being used on the dedicated workspace. |
| 381 | Regression | Pin non-mutating export/read behavior and preserve 371/372 loader ownership boundaries. |
| 382 | Rolling roadmap/handoff | Adopt 10-build execution cadence and maintain this next-20 queue. |

## Next execution batch — Builds 383–392

| Build | Planned target | Guardrail / expected result |
| --- | --- | --- |
| 383 | Gift Cards schema authority audit | Inventory all active gift-card tables/columns/endpoints before touching runtime. |
| 384 | Gift Cards fresh-install parity | Restore missing active gift-card schema to aggregate/migration authority; no request-time DDL. |
| 385 | Gift Cards read contract | Add readiness-aware admin gift-card read boundary. |
| 386 | Gift Cards Operations workspace | Activate a dedicated read-only admin page if schema parity is proven. |
| 387 | Gift Cards mutation audit | Separate issue/redeem/adjust/balance writes from read lifecycle; do not move writes implicitly. |
| 388 | Orders schema/read audit | Recheck `orders.total_amount|total` drift and current startup reads before write extraction. |
| 389 | Orders status mutation contract | Extract reviewed order-status changes behind an Operations-owned authority. |
| 390 | Orders payment/refund boundary | Audit payment/refund/dispute writes and identify owned authority without changing providers. |
| 391 | Orders fulfillment boundary | Extract fulfillment/status evidence write boundary where safe. |
| 392 | Today Tasks action contract | Formalize Done/Ignore/Snooze write authority; preserve compensating/audited semantics. |

## Following execution batch — Builds 393–402

| Build | Planned target | Guardrail / expected result |
| --- | --- | --- |
| 393 | Today Tasks action schema ownership | Remove action-time schema self-creation once migration authority is verified. |
| 394 | Membership assignment mutation contract | Extract assign/remove tier writes without changing read runtime. |
| 395 | Membership policy mutation contract | Extract policy edits from compatibility POST; keep Build 362 read untouched. |
| 396 | Customer Documents startup-read audit | Identify automatic reads and any hidden schema mutation. |
| 397 | Customer Documents owned read boundary | Add page-specific read contract/service only if audit is clean. |
| 398 | Customer Documents mutation audit | Map create/send/archive/delete/document-state writes to retained authorities. |
| 399 | Accounting parity repair batch | Address active missing accounting schema such as `accounting_order_records`, `accountant_export_manifests`, and known column drift. |
| 400 | Aggregate-schema execution verification | Resolve `notification_dispatch_log(s)` fresh-install discrepancy and prove aggregate schema actually materializes declared tables. |
| 401 | Production-only active-table parity | Re-audit remaining active Production-only tables and add missing fresh-install definitions where justified. |
| 402 | Fresh-install parity smoke + data-copy gate | Rebuild a clean Development database, verify active schema parity, then decide whether Production business-data copy is safe. |

## Standing constraints

- Exactly one Core + Commerce & Operations + Creative & Production + Business & Administration.
- GET/read paths report readiness; migrations/readiness tooling owns schema creation/repair.
- Top-level runtime activation never implies mutation ownership.
- Creative & Production loader/read boundaries are closed and should not be expanded merely to create activity.
- Production/main remains frozen.
- Fresh-install schema parity must be resolved before Production business-data copy.
- Passing browser/local write tests are not repeated merely to prove a wrapper.

## Rolling maintenance rule

When a 10-build batch closes:

1. Mark its exact local/browser state in the relevant validation files.
2. Promote the next 10 rows into the current execution batch.
3. Append another 10 rows so this document again contains 20 future builds.
4. Reorder only when validation evidence or schema parity makes the planned order unsafe.
