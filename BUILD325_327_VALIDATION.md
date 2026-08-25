# Builds 325–327 Validation — Accounting Read Batch

## Status — VALIDATED 2026-08-24

```text
Build 325  item-costing read extraction
Build 326  journal GET schema-mutation retirement + read extraction
Build 327  GIFI notes GET schema-mutation retirement + read extraction
```

## Development browser proof — PASS

All legacy and contract requests returned HTTP 200 with the expected build and `owner=accounting`. Development reported `schema_ready=true` and `request_time_schema_mutation=false` for item costing, journal, and GIFI notes. Passive services reported Builds 325/326/327 and no schema mutation.

The Accounting page remained:

```text
application_module         business-administration
application_mode           domain-bridge
active_application_module  null
contracts_ok               true
services_ok                true
```

## Corrected local regression — PASS

After the historical harness was corrected so it no longer required Build 328's blocker to remain present, Development returned:

```text
BUILDS 325-327 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
```

The earlier failed assertion was a stale test-harness expectation (`await ensureGlSchema(db)` in the next blocker), not a runtime failure.

## Boundary proven

- Item-costing GET is Accounting-owned and non-mutating.
- Journal GET no longer ensures/creates journal schema; explicit POST compatibility remains separate.
- GIFI-notes GET no longer creates schema; explicit POST save compatibility remains separate.
- No Accounting mutation ownership moved.
- Business & Administration remains intentionally inactive until remaining automatic reads are owned/non-mutating.
