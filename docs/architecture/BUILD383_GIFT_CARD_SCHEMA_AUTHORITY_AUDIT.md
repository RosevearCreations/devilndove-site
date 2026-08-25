# Build 383 — Gift Card Schema Authority Audit

Date: 2026-08-25

## Finding

Gift Cards is correctly classified under the Operations domain, but `/admin/gift-cards/` is not yet safe for top-level activation because three automatic startup GETs still create schema before reading.

Automatic page reads from `public/js/admin-gift-cards.js`:

```text
GET /api/admin/gift-card-delivery-templates
GET /api/admin/gift-card-abuse
GET /api/admin/gift-card-delivery-send
```

Current GET-time schema mutation:

- `gift-card-delivery-templates.js` creates `gift_card_delivery_templates` and `gift_card_delivery_queue`, then seeds activation/reissue templates.
- `gift-card-abuse.js` creates `gift_card_lookup_attempts` and `gift_card_lookup_lockouts`.
- `gift-card-delivery-send.js` creates `gift_card_delivery_queue`, `gift_card_provider_send_logs`, and a legacy-shaped `notification_outbox`.
- `gift-card-delivery-history.js` also creates `gift_card_delivery_queue` on an explicit history read.

Mutation authority `POST /api/admin/gift-card-actions` independently creates core Gift Card tables before writes:

```text
gift_cards
gift_card_redemptions
gift_card_admin_events
```

and its delivery helper also creates another legacy-shaped `notification_outbox` before queueing email work.

## Schema ownership conclusion

The active Gift Card-owned tables must be restored to migration/fresh-install authority before startup GET creation is removed:

```text
gift_cards
gift_card_redemptions
gift_card_admin_events
gift_card_delivery_templates
gift_card_delivery_queue
gift_card_provider_send_logs
gift_card_lookup_attempts
gift_card_lookup_lockouts
```

`notification_outbox` is deliberately excluded from the Gift Card-owned parity migration. It is a shared notification/platform table and current Gift Card writers assume incompatible historical column shapes. That mismatch requires a separate mutation/shared-schema reconciliation instead of letting Gift Cards redefine the table.

## Boundary for Builds 384–387

1. Restore Gift Card-owned tables through migration authority.
2. Make all Gift Card GETs non-mutating/readiness-aware.
3. Add one aggregate Operations-owned startup read contract.
4. Activate `/admin/gift-cards/` read-only under Commerce & Operations.
5. Keep issue/void/refund/reissue, delivery sends/templates, abuse lockouts, and notification writes on retained compatibility authorities until their mutation schemas are reconciled.

No Production database is changed by this source audit.
