# Builds 325–327 Validation — Accounting Read Batch

## Status — BROWSER PROVEN / CORRECTED LOCAL REGRESSION REQUIRED

This batch validates three bounded Accounting read changes together:

```text
Build 325  item-costing read extraction
Build 326  journal GET schema-mutation retirement + read extraction
Build 327  GIFI notes GET schema-mutation retirement + read extraction
```

## Development browser proof — PASSED 2026-08-24

Observed on `/admin/accounting/`:

```text
item_legacy_status                         200
item_legacy_build                          325
item_legacy_owner                          accounting
item_legacy_schema_ready                   true
item_legacy_schema_mutation                false
item_contract_status                       200
item_contract_build                        325
item_contract_owner                        accounting
item_contract_schema_ready                 true
item_contract_schema_mutation              false
accounting-item-costing-read_service_build 325
accounting-item-costing-read_service_schema_mutation false

journal_legacy_status                      200
journal_legacy_build                       326
journal_legacy_owner                       accounting
journal_legacy_schema_ready                true
journal_legacy_schema_mutation             false
journal_contract_status                    200
journal_contract_build                     326
journal_contract_owner                     accounting
journal_contract_schema_ready              true
journal_contract_schema_mutation           false
accounting-journal-read_service_build      326
accounting-journal-read_service_schema_mutation false

gifi_notes_legacy_status                   200
gifi_notes_legacy_build                    327
gifi_notes_legacy_owner                    accounting
gifi_notes_legacy_schema_ready             true
gifi_notes_legacy_schema_mutation          false
gifi_notes_contract_status                 200
gifi_notes_contract_build                  327
gifi_notes_contract_owner                  accounting
gifi_notes_contract_schema_ready           true
gifi_notes_contract_schema_mutation        false
accounting-gifi-notes-read_service_build   327
accounting-gifi-notes-read_service_schema_mutation false

application_module                         business-administration
application_mode                           domain-bridge
active_application_module                  null
contracts_ok                               true
services_ok                                true
```

All three read boundaries are browser-proven and Development reported no schema-parity deficit for these three reads.

## Local regression harness correction — 2026-08-24

The first post-Build-330 local run failed inside the regression harness on this stale assertion:

```text
assert "await ensureGlSchema(db)" in gifi_summary
```

That assertion described Build 327's *next blocker* rather than a Build 325–327 owned invariant. Build 328 intentionally removed that call, so the older test became false after the later successful extraction. The test also froze unrelated shared files against an older Git baseline, which would have produced more false failures as the architecture legitimately advances.

The regression has therefore been corrected to verify only the durable Build 325–327 boundaries:

- each owned read service remains present and non-mutating;
- each GET-only contract remains present;
- the legacy GET path delegates to the owned read service without read-time DDL;
- the shared contract/service catalogs may advance beyond Build 327 as long as the three registrations remain present.

The correction changes test coverage only; no application/runtime code changed.

## Corrected local regression still required

```bash
git pull --ff-only origin dev
python scripts/build325_327_accounting_read_batch_test.py
git status --short
```

Expected:

```text
BUILDS 325-327 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
```

`git status --short` should print nothing. Once this corrected local output is captured, Builds 325–327 become fully VALIDATED.

## Safety boundary

Browser proof used GET/read calls only. No journal sync/validate/post, GIFI-note save, expense save or other Accounting mutation is part of this gate.
