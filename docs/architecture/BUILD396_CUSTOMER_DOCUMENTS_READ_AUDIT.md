# Build 396 — Customer Documents Startup-Read Audit

## Scope

Page: `/admin/customer-documents/`

Mature UI: `public/js/admin-customer-documents.js` Build 227.

Legacy server authority: `functions/api/admin/customer-documents.js` Build 227.

## Finding

The page automatically calls `GET /api/admin/customer-documents` on DOMContentLoaded. The legacy GET calls `ensureSchema(db)` before reading, and that helper creates:

```text
customer_document_sequences
customer_documents
idx_customer_documents_order
idx_customer_documents_type_status
```

Therefore the current automatic page read violates the standing rule that GET/read paths report schema readiness while migrations/readiness tooling owns creation/repair.

The same legacy endpoint also owns explicit POST mutations:

```text
issue_document
void_document
```

Those POST actions must remain compatibility-owned during the read extraction because they generate sequential document numbers, preserve immutable source snapshots, link refunds, and write audit/runtime-incident evidence.

## Build 397 boundary

Build 397 must:

1. add migration authority for the two Customer Documents-owned tables/indexes;
2. add a GET-only Operations-owned read contract that performs no DDL;
3. move the dedicated page's automatic list/detail/preview reads to that contract;
4. register one passive `operations-customer-documents-read` service;
5. make `/admin/customer-documents/` use that one service instead of the broad legacy Operations service set;
6. keep all issue/void writes on `/api/admin/customer-documents` until the separate mutation audit/extraction.

## Guardrails

- No document is issued or voided for validation.
- No sequential-number mutation is moved into Core or the top-level runtime.
- Missing schema is reported as readiness evidence, never repaired by the owned GET.
- The existing immutable snapshot/document rendering semantics remain unchanged.
