# Builds 393–402 Validation — Modularity + Fresh-Install Parity

## Status — STAGED / CONSOLIDATED LOCAL + CUSTOMER DOCUMENTS BROWSER GATE REQUIRED

```text
393  Today Tasks action schema ownership
394  Membership assignment mutation authority + consumer migration
395  Membership policy schema/write authority + consumer migration
396  Customer Documents startup-read audit
397  Customer Documents owned read/runtime boundary
398  Customer Documents mutation audit + parity authority
399  Accounting runtime/fresh-install parity overlay
400  Aggregate/notification authority audit
401  Active runtime table parity audit
402  Fresh-install parity smoke / Production-data-copy fail-closed gate
```

## Consolidated local gate

Run:

```bash
python scripts/build393_402_modularity_parity_batch_test.py
```

Expected final output:

```text
BUILD 401 ACTIVE RUNTIME TABLE PARITY AUDIT: PASS
BUILD 402 FRESH INSTALL PARITY SMOKE: PASS
BUILDS 393-402 MODULARITY + PARITY BATCH: PASS
No Cloudflare resource was contacted.
```

Build 402 intentionally keeps the Production business-data-copy gate closed. Its local in-memory smoke proves the committed aggregate + parity overlays can build a current clean schema; it does not prove live Production-vs-Development row/data parity.

## Browser gate — Customer Documents only

After Development deploys, open:

```text
/admin/customer-documents/
```

The proof is read-only. Do not issue, void, delete, archive, send, or mutate a customer document.

Expected runtime/read boundary:

```text
contract                       operations-customer-documents-read
contract build                 397
owner                          operations
request-time schema mutation   false
mutation ownership moved       false
application module             commerce-operations
runtime build                  >=397
runtime state                  active
current domain                 operations
last pathname                  /admin/customer-documents/
required services              ["operations-customer-documents-read"]
page proven                    true
network transport              false
customer-documents mutation    false
contracts/services             true
```

If schema readiness is false, preserve exact missing tables/columns as parity evidence. Do not add DDL to GET.

## Schema application note

The following committed migration authorities are now part of the current fresh-install source:

```text
database_gift_card_runtime_parity.sql
database_today_task_actions_runtime_parity.sql
database_membership_tier_policy_runtime_parity.sql
database_customer_documents_runtime_parity.sql
database_accounting_runtime_parity.sql
```

Gift Card parity has already been applied/proven against Development D1. The later overlays still require an explicit Development parity application/readiness checkpoint before request-time compatibility schema fallbacks are retired globally.

## Production gate

Production/main remains frozen. Production business-data copy remains blocked until live read-only schema/data mapping is completed and reconciled against the clean Development schema.
