# Build 398 — Customer Documents Mutation Audit

## Scope

Compatibility authority:

```text
POST /api/admin/customer-documents
```

Build 397 moved all GET/list/detail/preview behavior to the non-mutating `operations-customer-documents-read` authority. This audit intentionally leaves issue/void writes on the mature endpoint.

## Mutation actions

### `issue_document`

The mature implementation:

1. validates document type and order;
2. reads order, item, payment and refund facts;
3. requires a recorded refund for credit notes/refund confirmations;
4. allocates the next sequential document number through `customer_document_sequences`;
5. captures an immutable source snapshot;
6. inserts `customer_documents`;
7. writes admin-audit evidence;
8. returns print-ready snapshot data.

This is a compound financial/document mutation and must not be reduced to a thin generic INSERT contract.

### `void_document`

The mature implementation:

1. validates a stable `customer_document_id` and reason;
2. preserves the immutable snapshot;
3. changes only formal document status/void metadata;
4. writes admin-audit evidence.

A void is not a delete.

## Remaining write-side schema fallback

`functions/api/admin/customer-documents.js` still calls its retained `ensureSchema(db)` in POST only. Build 397 created migration authority:

```text
database_customer_documents_runtime_parity.sql
```

The fallback must not be removed until that migration is proven on the target Development database/fresh-install gate. No GET calls it.

## Ownership decision

```text
read owner                 operations / Build 397
issue mutation owner       compatibility `/api/admin/customer-documents`
void mutation owner        compatibility `/api/admin/customer-documents`
top-level runtime writes   none
```

A later mutation extraction may introduce explicit Operations contracts after schema parity proof. Build 398 does not execute or migrate either write.

## Validation guardrails

- Do not issue a document merely to prove a wrapper.
- Do not void a real document for validation.
- Do not reset or manually edit sequence rows.
- Do not move accounting/refund business rules into Core.
- Preserve immutable snapshots and audit evidence when mutation extraction eventually occurs.
