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

`wrangler.toml` is explicitly Development-only and binds:

```text
Pages project  devilndove-site-dev
D1 binding     DB
D1 database    devilndove-dev
D1 id          dbc1615b-dcbe-4951-973b-b47c99c73bfa
```

Production/main is not part of this release gate.

Build 384 must be applied to the Development D1 before `schema_ready=true` is required from the Build 385 browser contract. The migration is idempotent for fresh table creation/default template seeding and intentionally does not redefine the shared `notification_outbox` table.

## Local regression status

The accumulated local Commerce checkpoint passed on 2026-08-25:

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

## Build 384 remote D1 execution note

The normal Wrangler remote-file command:

```bash
npx wrangler d1 execute devilndove-dev --remote --config wrangler.toml --file=database_gift_card_runtime_parity.sql --yes
```

hit the known remote import/polling failure shape:

```text
File already uploaded. Processing.
{"D1_RESET_DO":true}
```

On Windows the Wrangler process then also exited through a Node/libuv `UV_HANDLE_CLOSING` assertion. This is not a SQL validation error from the Build 384 migration.

Do not keep retrying the `--file` path. Use the repository-owned direct-query fallback instead:

```bash
git -c gc.auto=0 pull --ff-only origin dev
python scripts/build384_apply_gift_card_parity_direct.py
```

The first direct-query fallback run then exposed a Windows-only helper bug before D1 diagnostics could be printed:

```text
UnicodeDecodeError: 'charmap' codec can't decode byte 0x8f
```

That failure was local Python subprocess decoding, not D1 or SQL. The helper now pins Wrangler output decoding to UTF-8 with replacement and disables color output so malformed/progress bytes cannot abort the release helper.

The fallback:

- refuses to run off the `dev` branch;
- verifies `devilndove-site-dev` and `devilndove-dev` from `wrangler.toml`;
- reads the authoritative `database_gift_card_runtime_parity.sql` file;
- refuses any migration that attempts to redefine `notification_outbox`;
- performs a read-only Development D1 preflight;
- splits the migration into bounded statement batches;
- uses `wrangler d1 execute --command` rather than the failing remote `--file` import path;
- decodes Wrangler/Node output safely on Windows;
- verifies all eight Gift Card-owned tables;
- verifies migration-owned `activation` and `reissue` templates.

Expected final line:

```text
BUILD 384 DIRECT DEVELOPMENT D1 PARITY FALLBACK: COMPLETE
```

The verified table set must contain:

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

The template verification must return:

```text
activation
reissue
```

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

The registered service object is Build 386; its `list()` result carries the Build 385 server contract payload. This distinction is intentional.

If `schema_ready=false`, paste `missing_tables` and `query_errors`. Do not repair schema from GET. Build 384 is the migration authority.

Builds 389, 391, and 392 are mutation-authority source boundaries only in this batch. Do not execute writes merely to validate their existence.
