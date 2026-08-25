# Builds 383–392 Validation — Commerce & Operations 10-Build Batch

## Status — STAGED / LOCAL + DEVELOPMENT D1 + GIFT CARD BROWSER VALIDATION REQUIRED

```text
383  Gift Card schema-authority audit
384  Gift Card migration-owned fresh-install parity
385  Operations Gift Cards startup-read contract
386  Gift Cards Commerce runtime/page activation
387  Gift Card mutation audit + non-mutating delivery-history GET
388  Orders schema/read audit
389  Operations order-status write authority
390  Orders payment/refund/provider audit
391  Operations fulfillment transition authority
392  Operations Today Tasks action authority
```

## Development release target

`wrangler.toml` is explicitly Development-only and binds:

```text
Pages project  devilndove-site-dev
D1 binding     DB
D1 database    devilndove-dev
D1 id          dbc1615b-dcbe-4951-973b-b47c99c73bfa
```

Production/main is not part of this release gate.

Build 384 must be applied to the Development D1 before `schema_ready=true` is required from the Build 385 browser contract. The migration is idempotent for fresh table creation/default template seeding and intentionally does not redefine the shared `notification_outbox` table.

## Local regression + Development D1 parity release

Run from the repository root on `dev`:

```bash
git -c gc.auto=0 pull --ff-only origin dev

python scripts/build362_364_operations_membership_runtime_test.py
python scripts/build365_membership_read_resilience_test.py
python scripts/build366_368_today_tasks_runtime_test.py
python scripts/build369_today_tasks_schema_alignment_test.py
python scripts/build370_372_custom_requests_runtime_test.py
python scripts/build373_382_custom_requests_read_surface_test.py
python scripts/build383_392_commerce_operations_batch_test.py

npx wrangler d1 execute devilndove-dev --remote --config wrangler.toml --file=database_gift_card_runtime_parity.sql
npx wrangler d1 execute devilndove-dev --remote --config wrangler.toml --command="SELECT name FROM sqlite_master WHERE type='table' AND name IN ('gift_cards','gift_card_redemptions','gift_card_admin_events','gift_card_delivery_templates','gift_card_delivery_queue','gift_card_provider_send_logs','gift_card_lookup_attempts','gift_card_lookup_lockouts') ORDER BY name;"

git rev-parse --short HEAD
git status --short
```

Expected:

- seven local PASS results;
- each regression remains source/local only and does not contact Cloudflare;
- the D1 verification query returns all eight Gift Card-owned tables;
- clean Git status.

The two explicit Wrangler commands are the only Cloudflare/D1 operations in this gate. They target `devilndove-dev` from the Development-only `wrangler.toml`.

## Firefox gate — Gift Cards only

After Development deploys, open:

```text
/admin/gift-cards/
```

Do not save templates, resend, send through a provider, queue notification outbox records, change card state, or perform abuse lock/unlock actions.

Run the supplied read-only proof against:

```text
GET /api/admin/contracts/operations-gift-cards-read
```

Expected structural state:

```text
contract_status                  200
contract_build                   385
contract_owner                   operations
contract_id                      operations-gift-cards-read
schema_ready                     true
missing_tables                   []
query_error_count                0
request_time_schema_mutation     false
request_time_default_seeding     false
mutation_ownership_moved         false
migration_authority              database_gift_card_runtime_parity.sql
service_registered               true
service_build                    386
application_module               commerce-operations
application_mode                 active
active_application_module        commerce-operations
operations_domain                operations
runtime_build                    386
activation_build                 386
runtime_state                    active
last_pathname                    /admin/gift-cards/
services_ready                   true
required_services                ["operations-gift-cards-read"]
gift_cards_page_proven           true
creates_network_transport        false
gift_cards_mutation_ownership    false
contracts_ok                     true
services_ok                      true
```

If `schema_ready=false`, paste `missing_tables` and `query_errors`. Do not repair schema from GET. Build 384 is the migration authority.

Builds 389, 391, and 392 are mutation-authority source boundaries only in this batch. Do not execute writes merely to validate their existence.
