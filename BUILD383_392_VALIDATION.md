# Builds 383–392 Validation — Commerce & Operations 10-Build Batch

## Status — LOCAL PASSED / DEVELOPMENT D1 + GIFT CARD BROWSER VALIDATION REQUIRED

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

The accumulated Commerce checkpoint passed on 2026-08-25:

```text
BUILDS 362-364 OPERATIONS MEMBERSHIP RUNTIME: PASS
BUILD 365 MEMBERSHIP READ RESILIENCE: PASS
BUILDS 366-368 TODAY TASKS RUNTIME: PASS
BUILD 369 TODAY TASKS SCHEMA ALIGNMENT: PASS
BUILDS 370-372 CUSTOM REQUESTS RUNTIME: PASS
BUILDS 373-382 CUSTOM REQUESTS READ SURFACE: PASS
BUILDS 383-392 COMMERCE OPERATIONS BATCH: PASS
```

No local regression contacted Cloudflare.

## Build 384 Development D1 release history

The normal Wrangler remote `--file` path failed after upload with:

```text
File already uploaded. Processing.
{"D1_RESET_DO":true}
```

Wrangler then hit a Windows Node/libuv `UV_HANDLE_CLOSING` assertion. This was not a Build 384 SQL validation error.

The repository-owned direct-query fallback was introduced at:

```text
scripts/build384_apply_gift_card_parity_direct.py
```

Its first run exposed Windows CP1252 subprocess decoding; the helper now decodes Wrangler output explicitly as UTF-8 with replacement.

The next run proved the direct `--command` route works. The read-only preflight found seven of the eight Gift Card-owned tables already present:

```text
gift_card_admin_events
gift_card_delivery_queue
gift_card_delivery_templates
gift_card_lookup_attempts
gift_card_provider_send_logs
gift_card_redemptions
gift_cards
```

Only `gift_card_lookup_lockouts` was absent at that checkpoint.

The first executable direct-query attempt then failed because the migration comment `-- Devil n Dove Build 384` was interpreted by Wrangler/Yargs as a CLI option. The helper now removes full-line SQL comments before constructing command arguments.

The following two-batch direct-query attempt reached D1 successfully. Batch 1 completed, while batch 2 returned:

```text
incomplete input: SQLITE_ERROR
```

To remove multi-statement ambiguity entirely, the fallback was changed to execute each of the 24 authoritative migration statements separately through `wrangler d1 execute --command` and print a short SQL preview before every statement.

The first one-statement run proved statement 1 (`PRAGMA foreign_keys = ON`) succeeds, but statement 2 (`CREATE TABLE IF NOT EXISTS gift_cards (...)`) still returned `incomplete input` even though the migration source is syntactically complete. Because the direct read-only preflight and short PRAGMA command both succeed, the remaining failure is Windows `npx.cmd` multiline argument transport rather than SQLite schema validation.

The helper now compacts every SQL command to one physical line outside quoted strings before invoking Wrangler. Quoted template text is preserved exactly, command length is revalidated after compaction, and the helper refuses any command that still contains a physical newline.

Run only:

```bash
git -c gc.auto=0 pull --ff-only origin dev
python scripts/build384_apply_gift_card_parity_direct.py
```

Do not rerun the seven passing application regressions and do not return to the Wrangler remote `--file` path.

Expected final line:

```text
BUILD 384 DIRECT DEVELOPMENT D1 PARITY FALLBACK: COMPLETE
```

Final verification must contain all eight tables:

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

and both migration-owned templates:

```text
activation
reissue
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
