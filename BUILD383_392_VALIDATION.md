# Builds 383–392 Validation — Commerce & Operations 10-Build Batch

## Status — STAGED / LOCAL + GIFT CARD BROWSER VALIDATION REQUIRED

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

## Local regression

```bash
git -c gc.auto=0 pull --ff-only origin dev

python scripts/build362_364_operations_membership_runtime_test.py
python scripts/build365_membership_read_resilience_test.py
python scripts/build366_368_today_tasks_runtime_test.py
python scripts/build369_today_tasks_schema_alignment_test.py
python scripts/build370_372_custom_requests_runtime_test.py
python scripts/build373_382_custom_requests_read_surface_test.py
python scripts/build383_392_commerce_operations_batch_test.py

git rev-parse --short HEAD
git status --short
```

Expected seven PASS results and a clean tree. No regression contacts Cloudflare.

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

If `schema_ready=false`, paste `missing_tables` and `query_errors`. Do not repair schema from GET. Build 384 is the migration authority and its application/fresh-install verification belongs to the parity workflow.

Builds 389, 391, and 392 are mutation-authority source boundaries only in this batch. Do not execute writes merely to validate their existence.
