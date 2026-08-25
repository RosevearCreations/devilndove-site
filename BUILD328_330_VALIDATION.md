# Builds 328–330 Validation — Accounting Read-Time DDL Retirement Batch

## Status — VALIDATED 2026-08-24

```text
Build 328  GIFI summary GET schema-mutation retirement + read extraction
Build 329  Period locks GET schema-mutation retirement + read extraction
Build 330  Accounting attachments GET schema-mutation retirement + read extraction
```

## Local regression — PASS

```text
BUILDS 328-330 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
```

## Development browser proof — PASS

All six legacy/contract requests returned HTTP 200 with the expected build and `owner=accounting`.

```text
gifi summary      Build 328  schema_ready=true  mutation=false
period locks      Build 329  schema_ready=true  mutation=false
attachments       Build 330  schema_ready=true  mutation=false
```

The three passive services also reported their expected builds, `schemaReady=true`, and `requestTimeSchemaMutation=false`.

The Accounting page remained:

```text
application_module         business-administration
application_mode           domain-bridge
active_application_module  null
contracts_ok               true
services_ok                true
```

## Boundary proven

- GIFI summary GET no longer calls `ensureGlSchema()` or performs CREATE/ALTER.
- Period-lock GET no longer ensures closure/attachment/import schema.
- Attachment GET no longer creates/repairs the attachments table.
- Explicit write/upload/lock behavior remains in the existing write paths.
- No Accounting mutation ownership moved.
- Business & Administration remains intentionally inactive.
