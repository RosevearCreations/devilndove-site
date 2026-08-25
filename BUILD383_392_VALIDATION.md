# Builds 383–392 Validation — Commerce & Operations 10-Build Batch

## Status — BUILD 384 SOURCE CORRECTION LOCAL RERUN + DEVELOPMENT D1 + GIFT CARD BROWSER REQUIRED

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

The accumulated Commerce checkpoint passed on 2026-08-25 before the lookup-attempt parity correction:

```text
BUILDS 362-364 OPERATIONS MEMBERSHIP RUNTIME: PASS
BUILD 365 MEMBERSHIP READ RESILIENCE: PASS
BUILDS 366-368 TODAY TASKS RUNTIME: PASS
BUILD 369 TODAY TASKS SCHEMA ALIGNMENT: PASS
BUILDS 370-372 CUSTOM REQUESTS RUNTIME: PASS
BUILDS 373-382 CUSTOM REQUESTS READ SURFACE: PASS
BUILDS 383-392 COMMERCE OPERATIONS BATCH: PASS
```

No local regression contacted Cloudflare. Because Build 384 migration/test source changed after the last line above, only `scripts/build383_392_commerce_operations_batch_test.py` requires rerun before final closure; the earlier six passing regressions do not.

## Build 384 Development D1 release history

The normal Wrangler remote `--file` path failed after upload with:

```text
File already uploaded. Processing.
{"D1_RESET_DO":true}
```

Wrangler then hit a Windows Node/libuv `UV_HANDLE_CLOSING` assertion. This was not a Build 384 SQL validation error.

The repository-owned direct-query fallback is:

```text
scripts/build384_apply_gift_card_parity_direct.py
```

The helper was progressively hardened for Windows CP1252 output decoding, Wrangler/Yargs parsing of leading SQL comments, multi-statement ambiguity, and multiline `npx.cmd` argument transport. It now sends one compact physical-line SQL statement at a time through `wrangler d1 execute --command`.

A read-only Development preflight proved seven of the eight Gift Card-owned tables were already present. At that checkpoint only `gift_card_lookup_lockouts` was absent.

The compact single-statement release then progressed successfully through statement 20. Statement 21 failed on:

```text
CREATE INDEX IF NOT EXISTS idx_gift_card_lookup_attempts_email
ON gift_card_lookup_attempts(lookup_email, created_at DESC);
```

with:

```text
no such column: lookup_email
```

This is genuine legacy-schema drift, not a Wrangler transport failure. `gift_card_lookup_attempts` exists in Development with an older shape.

The current public Gift Card balance runtime uses the combined/current lookup-attempt model:

```text
code_hint
email_hash
client_key
lookup_email
code_suffix
ip_hash
user_agent
result_status
was_success
created_at
```

Build 384 has therefore been corrected so:

1. `database_gift_card_runtime_parity.sql` creates the full current lookup-attempt shape on fresh installs;
2. the Development release helper performs idempotent legacy-column alignment immediately after the lookup-attempt table CREATE statement;
3. duplicate-column errors during that compatibility alignment are treated as already-aligned success;
4. the email index is created only after the current columns have been reconciled;
5. final verification checks the current lookup-attempt column set as well as all eight tables and the two default templates;
6. the Build 383–392 local regression now compares the migration/helper requirements with the current public Gift Card runtime so this drift cannot silently return.

## Minimal rerun after the parity correction

Run only:

```bash
git -c gc.auto=0 pull --ff-only origin dev
python scripts/build383_392_commerce_operations_batch_test.py
python scripts/build384_apply_gift_card_parity_direct.py
```

Do not rerun the earlier six passing Commerce regressions and do not return to the Wrangler remote `--file` path.

Expected local result:

```text
BUILDS 383-392 COMMERCE OPERATIONS BATCH: PASS
No Cloudflare resource was contacted.
```

Expected D1 final line:

```text
BUILD 384 DIRECT DEVELOPMENT D1 PARITY FALLBACK: COMPLETE
```

Final verification must contain all eight Gift Card-owned tables:

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

Both migration-owned templates:

```text
activation
reissue
```

And the current lookup-attempt columns listed above.

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
