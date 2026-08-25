# Build 387 — Gift Card Mutation Boundary Audit

Date: 2026-08-25

Build 386 activates only the Gift Card read lifecycle. This audit records the retained mutation surface and blocks premature ownership moves.

## Retained write authorities

```text
POST /api/admin/gift-card-actions
POST /api/admin/gift-card-delivery-templates
POST /api/admin/gift-card-delivery-send
POST /api/admin/gift-card-abuse
```

These remain compatibility-owned. The Commerce runtime reports `giftCardsMutationOwnership=false` and does not register them as activation services.

## Findings

### 1. Core card actions still self-ensure schema

`gift-card-actions.js` calls `ensureTables(db)` before activate/void/refund/reissue mutations. Build 384 now provides the Gift Card-owned migration authority, but the POST path must not have its self-ensure removed until migration application/fresh-install verification is proven.

### 2. Shared notification_outbox has incompatible historical shapes

Gift Card writers currently assume at least two different `notification_outbox` schemas:

- `gift-card-actions.js` expects `channel`, `destination`, `metadata_json`, `status`, `next_attempt_at`;
- `gift-card-delivery-send.js` expects `recipient_email`, `subject`, `body`, `send_status`;
- the current aggregate notification schema has its own platform-owned shape.

Gift Cards must not redefine this shared table. Reconcile notification authority/schema before extracting delivery-send mutations.

### 3. Abuse release UI/API mismatch

The older UI attempted `action='release_lockout'` with an email/code key, while `gift-card-abuse.js` currently accepts `action='unlock'` and requires `gift_card_lookup_lockout_id`. Build 386 removes that unsafe release button from the automatic read UI until a reviewed mutation contract is defined.

### 4. History GET corrected

Build 387 removes request-time `CREATE TABLE gift_card_delivery_queue` from `GET /api/admin/gift-card-delivery-history`. Missing schema is now reported with `schema_ready=false` and `missing_tables`.

## Mutation extraction order

1. prove Build 384 schema migration on a fresh Development install;
2. reconcile shared `notification_outbox` schema/authority;
3. extract card state actions (activate/void/refund/reissue);
4. extract template/resend writes;
5. extract provider send/outbox writes;
6. extract abuse lock/unlock with stable lockout ID semantics.

No write operation is required for Build 386/387 browser validation.
