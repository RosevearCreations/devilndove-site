# Builds 383–392 Validation — Commerce & Operations 10-Build Batch

## Status — DEVELOPMENT D1 PASSED / BUILD 383–392 LOCAL RERUN + GIFT CARD BROWSER REQUIRED

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

`wrangler.toml` is Development-only and binds:

```text
Pages project  devilndove-site-dev
D1 binding     DB
D1 database    devilndove-dev
D1 id          dbc1615b-dcbe-4951-973b-b47c99c73bfa
```

Production/main is not part of this release gate.

## Local regression status

The accumulated Commerce checkpoint passed on 2026-08-25 before the final lookup-attempt parity correction:

```text
BUILDS 362-364 OPERATIONS MEMBERSHIP RUNTIME: PASS
BUILD 365 MEMBERSHIP READ RESILIENCE: PASS
BUILDS 366-368 TODAY TASKS RUNTIME: PASS
BUILD 369 TODAY TASKS SCHEMA ALIGNMENT: PASS
BUILDS 370-372 CUSTOM REQUESTS RUNTIME: PASS
BUILDS 373-382 CUSTOM REQUESTS READ SURFACE: PASS
BUILDS 383-392 COMMERCE OPERATIONS BATCH: PASS
```

No local regression contacted Cloudflare. Because Build 384 migration/test source changed after the last `383-392` PASS above, only `scripts/build383_392_commerce_operations_batch_test.py` requires rerun before final closure; the earlier six passing regressions do not.

## Build 384 Development D1 release — PASSED 2026-08-25

The normal Wrangler remote `--file` path first failed after upload with the known `D1_RESET_DO` shape and a Windows Node/libuv teardown assertion. The repository-owned fallback was progressively hardened for Windows output decoding, leading SQL comments, multi-statement ambiguity, and multiline `npx.cmd` argument transport.

The first real schema defect then appeared in Development: the existing `gift_card_lookup_attempts` table had an older anti-abuse shape without `lookup_email`. Build 384 was corrected so fresh installs create the full current table and the Development fallback aligns missing legacy columns before creating current indexes.

The final direct-query run completed successfully against Development D1.

### Lookup-attempt compatibility alignment

Existing legacy columns were correctly tolerated as already present:

```text
code_hint
email_hash
client_key
was_success
```

Missing current columns were added successfully:

```text
lookup_email
code_suffix
ip_hash
user_agent
result_status
```

The current email index then succeeded:

```text
idx_gift_card_lookup_attempts_email
```

### Missing lockout parity restored

The previously absent table was created successfully:

```text
gift_card_lookup_lockouts
```

and its status index was created:

```text
idx_gift_card_lookup_lockouts_status
```

### Final verified Gift Card-owned tables

```text
gift_card_admin_events
gift_card_delivery_queue
gift_card_delivery_templates
gift_card_lookup_attempts
gift_card_lookup_lockouts
gift_card_provider_send_logs
gift_card_redemptions
gift_cards
```

### Final verified migration-owned templates

```text
activation
reissue
```

### Final verified current lookup-attempt columns

```text
client_key
code_hint
code_suffix
created_at
email_hash
ip_hash
lookup_email
result_status
user_agent
was_success
```

The release helper reached:

```text
BUILD 384 DIRECT DEVELOPMENT D1 PARITY FALLBACK: COMPLETE
```

Build 384 Development D1 parity is therefore **PASSED**. Do not return to the Wrangler remote `--file` path for this release.

## Remaining local closure

Because the Build 383–392 regression was strengthened after the initial local PASS, run only:

```bash
git -c gc.auto=0 pull --ff-only origin dev
python scripts/build383_392_commerce_operations_batch_test.py
git status --short
```

Expected:

```text
BUILDS 383-392 COMMERCE OPERATIONS BATCH: PASS
No Cloudflare resource was contacted.
```

## Firefox gate — Gift Cards only

After Development deploys, open:

```text
/admin/gift-cards/
```

Do not save templates, resend, send through a provider, queue notification-outbox records, change card state, or perform abuse lock/unlock actions.

Read-only expected structural state:

```text
contract_status                    200
contract_build                     385
contract_owner                     operations
contract_id                        operations-gift-cards-read
schema_ready                       true
missing_tables                     []
query_error_count                  0
request_time_schema_mutation       false
request_time_default_seeding       false
mutation_ownership_moved           false
migration_authority                database_gift_card_runtime_parity.sql
service_registered                 true
service_registration_build         386
service_contract_build             385
service_schema_ready               true
service_schema_mutation            false
application_module                 commerce-operations
application_mode                   active
active_application_module          commerce-operations
operations_domain                  operations
runtime_build                      386
activation_build                   386
runtime_state                      active
last_pathname                      /admin/gift-cards/
services_ready                     true
required_services                  ["operations-gift-cards-read"]
gift_cards_page_proven             true
creates_network_transport          false
gift_cards_mutation_ownership      false
contracts_ok                       true
services_ok                        true
```

The registered service object is Build 386; its `list()` result carries the Build 385 server-contract payload.

If `schema_ready=false`, preserve `missing_tables` and `query_errors`; do not repair schema from GET. Build 384 remains the migration authority.

Builds 389, 391, and 392 are mutation-authority source boundaries only. Do not execute real writes merely to validate their existence.
