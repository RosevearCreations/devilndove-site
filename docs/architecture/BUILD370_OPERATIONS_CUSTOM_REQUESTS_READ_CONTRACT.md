# Build 370 — Operations Custom Requests Startup Read Contract

## Purpose

Formalize the automatic Custom Requests workspace read without moving quote, payment, order, fulfillment, marketplace, consent, or product-plan mutation authority.

## Existing compatibility behavior

`functions/api/admin/custom-requests.js` already separates its normal dashboard list from the large `ensureSchema()` mutation helper:

```text
normal GET        -> listPayload(db)
POST workflow     -> ensureSchema(db) + retained mutations
marketplace CSV   -> compatibility GET that still ensure/seeds schema
```

The normal `listPayload` read has been non-migrating since Build 197, but missing tables are silently caught and represented as empty arrays.

## Build 370 contract

```text
GET /api/admin/contracts/operations-custom-requests-read
```

The contract:

- rewrites the child request to `/api/admin/custom-requests` with an empty query string;
- therefore cannot enter `format=marketplace_csv`;
- invokes the mature normal list GET;
- performs read-only `PRAGMA table_info(...)` checks for every table used by `listPayload`;
- returns `schema_ready`, `missing_tables`, and `checked_tables`;
- reports `request_time_schema_mutation=false`;
- reports `mutation_ownership_moved=false`;
- preserves `/api/admin/custom-requests` as compatibility POST authority.

## Deliberate exclusion

The legacy `?format=marketplace_csv` GET still calls `ensureSchema()` and seeds marketplace presets. It is explicitly outside the Build 370 owned startup-read contract and remains a later compatibility/export cleanup target.

No Build 370 request performs CREATE, ALTER, INSERT, UPDATE, or DELETE.
