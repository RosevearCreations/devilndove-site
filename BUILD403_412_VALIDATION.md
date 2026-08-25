# Builds 403–412 Validation — Commerce Mutation Boundaries + Development RC

## Status — LOCAL RC PASS / DEVELOPMENT D1 MEMBERSHIP DRIFT REPAIR STAGED / READ-ONLY BROWSER PROOF REQUIRED

```text
403  Canonical shared notification schema/readiness authority
404  Gift Card card-state mutation schema cleanup + owned contract
405  Gift Card template/resend schema cleanup + owned contract
406  Gift Card provider/outbox canonicalization + owned contract
407  Gift Card abuse stable-ID authority + real UI consumer migration
408  Orders status/fulfillment schema cleanup + real consumer bridge
409  Payment/refund provider mutation fail-closed gate
410  Commerce modularity sanity + Development parity overlay applicator
411  Modular documentation consolidation
412  Development release-candidate local gate
```

## What materially changed

### Notification authority

`database_notification_runtime_parity.sql` is the canonical shared notification authority for:

```text
notification_outbox
notification_dispatch_log
notification_exclusions
notification_cooldown_rules
customer_engagement_runs
notification_automation_settings
gift_card_delivery_audit
```

The older plural `notification_dispatch_logs` job-attempt ledger remains distinct and is not collapsed into the singular outbox-delivery ledger.

### Gift Cards

Explicit Gift Card writes now use owned Operations contracts:

```text
operations-gift-card-action-write
operations-gift-card-template-write
operations-gift-card-provider-send-write
operations-gift-card-abuse-write
```

The corresponding implementations perform no request-time CREATE/ALTER/default seeding. Provider queueing writes the canonical Build 403 notification-outbox shape. The admin UI is migrated to those contracts and stable `gift_card_lookup_lockout_id` unlock semantics.

### Orders / payments

The mature Orders UI is retained. `admin-order-contract-bridge.js` routes its explicit writes through:

```text
operations-order-status-write
operations-order-fulfillment-write
operations-payment-action-write
```

Order status no longer creates Gift Card history tables when an order becomes paid. Provider-aware refund code is preserved, but Build 409 makes provider mutation local-only by default. External provider mutation requires both:

```text
PAYMENT_PROVIDER_MUTATIONS_ENABLED=1
provider_sync_confirmed=true
```

No provider write is required for validation.

## Local validation — PASS

The 2026-08-25 Development RC run completed:

```text
BUILDS 383-392 COMMERCE OPERATIONS BATCH: PASS
BUILD 401 ACTIVE RUNTIME TABLE PARITY AUDIT: PASS
BUILD 402 FRESH INSTALL PARITY SMOKE: PASS
BUILDS 393-402 MODULARITY + PARITY BATCH: PASS
BUILDS 403-410 COMMERCE MODULARITY: PASS
BUILD 412 DEVELOPMENT RC LOCAL GATE: PASS
No Cloudflare resource was contacted.
PRODUCTION PROMOTION: CLOSED — Development D1/browser/live parity gates are still required.
```

Build 402 also proved the current clean-install composition with 512 tables, 25 overlay-owned tables, current parity seeds, and a passing `PRAGMA foreign_key_check`.

## Development D1 authentication — RECOVERED

The first post-RC Build 410 Development D1 attempt stopped during its read-only preflight with Cloudflare `7403`. No schema SQL executed. The follow-up auth-only diagnostic proved OAuth authentication to the expected account, `d1 (write)` permission and a successful `SELECT 1 AS auth_probe` against `devilndove-dev`.

Authentication is no longer blocking Build 410. Do not rerun the already-green local RC suite because of the historical 7403.

## Development D1 parity application — MEMBERSHIP LEGACY SHAPE EXPOSED

The authenticated Build 410 retry successfully re-applied all four Today Tasks statements. The Membership migration then reached:

```text
database_membership_tier_policy_runtime_parity.sql STATEMENT 2/3
CREATE TABLE IF NOT EXISTS membership_tier_policies ...
```

and that statement was a no-op because Development already has a `membership_tier_policies` table. Statement 3 then failed with the first real Membership schema-drift evidence:

```text
table membership_tier_policies has no column named tier_code: SQLITE_ERROR [code: 7500]
```

This proves the existing Development table is a legacy shape. `CREATE TABLE IF NOT EXISTS` cannot upgrade it to the canonical Build 395 model.

The Build 410 applicator now performs a narrow, data-preserving reconciliation before the Membership seed:

1. Inspect `membership_tier_policies` columns and UNIQUE indexes.
2. Recover a preserved `membership_tier_policies_build410_legacy` table if a previous swap stopped after the backup rename.
3. Require the canonical Build 395 columns and UNIQUE `tier_code` authority.
4. If the active table is legacy, map known compatibility aliases (`id`, `code`, `name`, `description`, `benefits`, `badge_colour`) into a canonical shadow table while preserving policy IDs where available.
5. Reject duplicate/blank mapped tier codes before changing the active table.
6. Verify legacy/shadow row counts match.
7. Preserve the legacy table as `membership_tier_policies_build410_legacy`, activate the canonical shadow, then execute the normal Build 395 Bronze/Silver/Gold seed.
8. Verify current rows before retiring the legacy backup.

The helper refuses to discard a pre-existing backup while the active table remains non-canonical. This is intentionally narrower and safer than adding request-time schema repair.

Customer Documents, Accounting and Notification overlays did **not** run after the Membership failure and remain pending in the same applicator.

## Development D1 parity application — NEXT GATE

Pull current `dev` and rerun only:

```bash
python scripts/build410_apply_development_parity_overlays.py
```

The helper remains hard-pinned to:

```text
branch        dev
Pages project devilndove-site-dev
D1 database   devilndove-dev
```

Expected Membership recovery markers include:

```text
INSPECT MEMBERSHIP TIER POLICY COLUMNS
INSPECT MEMBERSHIP UNIQUE INDEXES
REBUILD LEGACY membership_tier_policies -> BUILD 395 CANONICAL SHAPE
CHECK MEMBERSHIP LEGACY CODE MAPPING
VERIFY MEMBERSHIP SHADOW ROW COUNT
BACK UP LEGACY MEMBERSHIP TABLE
ACTIVATE CANONICAL MEMBERSHIP TABLE
VERIFY MEMBERSHIP CURRENT ROWS
RETIRE MEMBERSHIP LEGACY BACKUP AFTER VERIFIED SEED
```

After Membership, the helper continues to Customer Documents, Accounting and Notification parity. Notification still aligns legacy `notification_outbox` columns immediately after its CREATE/no-op and before dependent indexes.

Expected final line:

```text
BUILD 410 DEVELOPMENT PARITY OVERLAY APPLICATOR: COMPLETE
```

If a later migration stops on another real mismatch, preserve the exact statement output and repair that parity gap. Do not move DDL back into request handlers.

## Read-only browser gates

### Customer Documents

Open `/admin/customer-documents/` and prove Build 397 read/runtime activation with one required service and no runtime mutation ownership.

### Gift Cards post-mutation-extraction sanity

Open `/admin/gift-cards/`. Do not click mutation controls. Confirm:

```text
startup read Build        385
mutation authority build  407
schema ready              true
owned mutation routes     Builds 404-407 contracts
runtime active            true
runtime mutation owner    false
UI mutation build         407
```

### Orders bridge / provider gate

Open `/admin/orders/`. Do not submit a status/refund/provider action. Confirm the page loaded `DDOrderContractBridge` Build 408 with status, fulfillment, and payment contract routes. Provider mutation remains disabled unless explicitly enabled and confirmed.

## Production

`main` remains frozen. Build 412 is a Development RC gate, not a Production promotion. Production business-data copy and Production promotion remain closed until live read-only schema/data mapping and the Development browser/D1 gates are complete.
