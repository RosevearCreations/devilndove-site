# Devil n Dove — Rolling Next 20 Builds

Updated 2026-08-25 after staging the 10-build Commerce & Operations batch (Builds 383–392).

## Cadence rule

Work in **10-build execution batches**. Keep the next **20 builds** visible here so two full batches are always queued behind the current work.

A validation failure may insert a bounded correction build and shift later numbers. Production remains frozen unless separately promoted.

## Current execution batch — Builds 383–392

| Build | Target | Staged outcome |
| --- | --- | --- |
| 383 | Gift Cards schema authority audit | Identified Gift Card-owned schema, startup GET mutation, shared notification conflict. |
| 384 | Gift Cards fresh-install parity | Added `database_gift_card_runtime_parity.sql` for eight Gift Card-owned tables/default templates. |
| 385 | Gift Cards read contract | Added readiness-aware GET-only `operations-gift-cards-read`. |
| 386 | Gift Cards Operations workspace | Automatic page read now uses one passive service; Commerce runtime/page activation added. |
| 387 | Gift Cards mutation audit | Kept writes compatibility-owned; made delivery-history GET non-mutating. |
| 388 | Orders schema/read audit | Confirmed current list GET is SELECT-only and uses `*_cents`/`total_cents`. |
| 389 | Orders status mutation contract | Added Operations-owned order-status authority delegating mature implementation. |
| 390 | Orders payment/refund boundary | Audited provider-aware refund/dispute writes; no provider behavior changed. |
| 391 | Orders fulfillment boundary | Added narrow `fulfilled` transition authority. |
| 392 | Today Tasks action contract | Added Operations-owned completed/ignored/snoozed authority; schema follow-up deferred to 393. |

## Next execution batch — Builds 393–402

| Build | Planned target | Guardrail / expected result |
| --- | --- | --- |
| 393 | Today Tasks action schema ownership | Move `today_task_actions` table/column creation to migration authority; remove POST self-repair after parity proof. |
| 394 | Membership assignment mutation contract | Extract assign/remove tier writes without changing validated read runtime. |
| 395 | Membership policy mutation contract | Extract policy edits from compatibility POST; keep Build 362 read untouched. |
| 396 | Customer Documents startup-read audit | Identify automatic reads and hidden schema mutation. |
| 397 | Customer Documents owned read boundary | Add page-specific read contract/service only if audit is clean. |
| 398 | Customer Documents mutation audit | Map create/send/archive/delete/document-state writes to retained authorities. |
| 399 | Accounting parity repair batch | Address active missing accounting schema such as `accounting_order_records`, `accountant_export_manifests`, and known column drift. |
| 400 | Aggregate-schema execution verification | Resolve `notification_dispatch_log(s)` discrepancy and prove declared aggregate tables materialize. |
| 401 | Production-only active-table parity | Re-audit active Production-only tables and add justified fresh-install definitions. |
| 402 | Fresh-install parity smoke + data-copy gate | Rebuild clean Development schema, verify parity, then decide whether Production business-data copy is safe. |

## Following execution batch — Builds 403–412

| Build | Planned target | Guardrail / expected result |
| --- | --- | --- |
| 403 | Shared notification_outbox authority | Reconcile current aggregate shape with Gift Card and Orders writer expectations before consumer migration. |
| 404 | Gift Card card-action mutation contract | Formalize activate/void/refund/reissue authority after Build 384 migration proof. |
| 405 | Gift Card template/resend mutation contract | Extract template/resend writes; default templates remain migration-owned. |
| 406 | Gift Card provider-send contract | Extract queue/provider/outbox write authority only after notification schema reconciliation. |
| 407 | Gift Card abuse lock/unlock contract | Replace legacy action/key mismatch with stable lockout-ID semantics and audit evidence. |
| 408 | Orders mutation consumer migration | Move reviewed status/fulfillment UI calls to Builds 389/391 contracts after source + browser safety proof. |
| 409 | Payment/refund schema + integration gate | Prove refund/dispute columns and provider test harness before any refund consumer migration. |
| 410 | Commerce & Operations boundary sanity | Re-run every page-specific Operations runtime/read contract and mutation-ownership invariant. |
| 411 | Modular documentation consolidation | Consolidate architecture/validation handoff while preserving exact historical validation states. |
| 412 | Development release-candidate gate | Full Development regression, schema readiness, browser sanity, and Production-promotion decision checkpoint. |

## Standing constraints

- Exactly one Core + Commerce & Operations + Creative & Production + Business & Administration.
- GET/read paths report readiness; migrations/readiness tooling owns schema creation/repair.
- Top-level runtime activation never implies mutation ownership.
- Creative & Production loader/read boundaries are closed and should not be expanded merely to create activity.
- Production/main remains frozen.
- Fresh-install schema parity must be resolved before Production business-data copy.
- Passing browser/local writes are not repeated merely to prove a wrapper.
- External provider mutations (Stripe/PayPal/etc.) require dedicated integration gates before consumer migration.

## Rolling maintenance rule

When a 10-build batch closes:

1. Mark exact local/browser state in validation files.
2. Promote the next 10 rows into the current execution batch.
3. Append another 10 rows so the document again contains 20 future builds.
4. Reorder only when validation or parity evidence makes the planned order unsafe.
