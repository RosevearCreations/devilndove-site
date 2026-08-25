# Devil n Dove AI Context — Build 316 Complete / Accounting Read-Time DDL Retirement Next

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Current modular architecture authority includes:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md`
- `docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md`
- `docs/architecture/BUILD306_INVENTORY_WRITE_CONTRACTS.md`
- `docs/architecture/BUILD307_INVENTORY_COMPENSATING_REVERSAL_SERVICE.md`
- `docs/architecture/BUILD308_CREATIVE_REVERSAL_CONSUMER_CUTOVER.md`
- `docs/architecture/BUILD309_INVENTORY_POST_AUTHORITY.md`
- `docs/architecture/BUILD310_CREATIVE_INVENTORY_POST_CONSUMER_CUTOVER.md`
- `docs/architecture/BUILD311_INVENTORY_COST_READ_CONTRACT.md`
- `docs/architecture/BUILD312_ACCOUNTING_READ_CONTRACT.md`
- `docs/architecture/BUILD313_OPERATIONS_READ_ONLY_RUNTIME.md`
- `docs/architecture/BUILD314_CUSTOMER_DOCUMENTS_OPERATIONS_RUNTIME.md`
- `docs/architecture/BUILD315_ORDERS_OPERATIONS_RUNTIME.md`
- `docs/architecture/BUILD316_ACCOUNTING_EXPENSES_READ_CORRECTION.md`
- `BUILD315_VALIDATION.md`
- `BUILD316_VALIDATION.md`

**Real Devil n Dove Production remains frozen at Build 280 unless deliberately promoted through the separate Production workflow.**

## Authoritative application structure

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Domains remain internal ownership/service boundaries beneath exactly three top-level modules.

Core owns only shared infrastructure: authentication/session context, module registry/lifecycle, route resolution, passive service/contract composition, common runtime helpers and availability. Core must not absorb business rules.

## Completed modular baselines

```text
Build 301 Packaging compatibility          COMPLETE IN DEVELOPMENT
Build 302 Core + exactly 3 modules         COMPLETE IN DEVELOPMENT
Build 303 umbrella classification         COMPLETE IN DEVELOPMENT
Build 304 Catalog runtime                 COMPLETE IN DEVELOPMENT
Build 305 Inventory runtime               COMPLETE IN DEVELOPMENT
Build 307 Inventory reversal service      COMPLETE IN DEVELOPMENT
Build 309 Inventory post authority        COMPLETE IN DEVELOPMENT
Build 310 Creative post consumer cutover  COMPLETE IN DEVELOPMENT
Build 311 Inventory cost read contract    COMPLETE IN DEVELOPMENT
Build 312 Accounting read contract        COMPLETE IN DEVELOPMENT
Build 313 Operations read-only runtime    COMPLETE IN DEVELOPMENT
Build 314 Customer Documents runtime      COMPLETE IN DEVELOPMENT
Build 315 Orders runtime coverage         COMPLETE IN DEVELOPMENT
Build 316 Accounting expenses read        COMPLETE IN DEVELOPMENT
```

Build 306 remains historically browser-proven with standalone local signoff not captured in the conversation. Do not silently relabel it.

Build 308 remains browser-proven; its standalone local regression output was not captured before later work began. Do not silently relabel it complete.

## Build 315 — COMPLETE IN DEVELOPMENT

Proven source/runtime head:

```text
1984d97d5656691d44ad96917d15e38b07e71016
Build 315 update modular handoff context
```

Completed handoff head:

```text
2edcc42865fe818baa5091f6db55c94dcb6c5363
Build 315 set completed modular handoff context
```

Build 315 proves exactly these read-only Operations runtime pages:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

Commerce/Operations remains Build 315 and owns no Operations mutations. Orders/payment/refund/gift-card business scripts/APIs remain compatibility behavior.

## Build 316 — COMPLETE IN DEVELOPMENT

Baseline:

```text
2edcc42865fe818baa5091f6db55c94dcb6c5363
Build 315 set completed modular handoff context
```

Proven source/runtime head:

```text
2047f29a52f54d3416792cc3c22f728b040f793b
Build 316 update modular Accounting handoff context
```

### Accounting-owned expenses read authority

New read service:

```text
functions/api/_lib/accountingExpensesReadService.js
build             316
contract          accounting-expenses-read
owner             accounting
authority table   accounting_expenses
attachment table  accounting_attachments
```

New authenticated GET-only contract:

```text
GET /api/admin/contracts/accounting-expenses-read
```

The service/contract:

- performs no CREATE/ALTER/DROP/INSERT/UPDATE/DELETE;
- reports `schema_ready`, `missing_tables`, and `missing_columns`;
- treats Accounting attachments as optional for this read;
- fully qualifies the expense authority as `ae`;
- joins attachment counts through `aa.expense_id = ae.expense_id`;
- selects/orders by qualified `ae.expense_id`;
- reports `request_time_schema_mutation=false`.

### Legacy compatibility split

Existing route remains:

```text
/api/admin/accounting-expenses
```

Build 316 changes only GET:

```text
GET -> delegates to Accounting-owned `readAccountingExpenses()`
```

The response retains the existing `expenses` field so the historical Accounting backend does not need a business-UI rewrite.

POST remains the existing compatibility write authority. It still owns vendor resolution, period-open checks, expense insertion, audit logging, and its current write-side schema ensure behavior. Do not call the expense write path modularized yet.

### Core composition identity

Build 316 adds explicit identity to the passive Core catalogs:

```text
contract catalog         316
service adapter registry 316
```

They register `accounting-expenses-read` as:

```text
owner accounting
consumer operations
mode read-only-http
```

Core only declares/registers the service. Accounting owns its business implementation.

Runtime implementation identities deliberately remain:

```text
Architecture build              302
Core runtime implementation     305
Contract catalog                316
Passive service adapters        316
Commerce runtime                315
Operations runtime              315
Accounting order read contract  312
Accounting expenses read        316
```

Build 316 does not widen the Operations page allow-list or change Commerce runtime.

### Build 316 validation proof

Development browser proof on `/admin/orders/`:

```text
legacy_status                    200
legacy_ok                        true
legacy_build                     316
legacy_contract                  accounting-expenses-read
legacy_owner                     accounting
legacy_schema_ready              true
legacy_schema_mutation           false
legacy_rows                      0
contract_status                  200
contract_ok                      true
contract_build                   316
contract_name                    accounting-expenses-read
contract_owner                   accounting
contract_schema_ready            true
contract_schema_mutation         false
contract_rows                    0
contract_catalog_build           316
service_adapter_build            316
expense_service_owner            accounting
expense_service_mode             read-only-http
service_build                    316
service_schema_ready             true
service_schema_mutation          false
service_rows                     0
core_runtime_build               305
commerce_runtime_build           315
owns_operations_mutations        false
contracts_ok                     true
services_ok                      true
```

Zero expense rows are valid Development state.

Final local regression:

```text
BUILD 316 ACCOUNTING EXPENSES READ CORRECTION: PASS
No Cloudflare resource was contacted.
```

No mutation validation was performed or required.

## Modular split audit / remaining work

`docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md` is the concise open-item authority for the split.

### Commerce & Operations

Proven Operations pages remain:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

Remaining loader/runtime coverage includes:

```text
/admin/gift-cards/
/admin/members/
/admin/membership/
/admin/custom-request/
/admin/today-tasks/
```

Loader coverage must remain separate from mutation-authority extraction.

### Creative & Production

Open items include:

- top-level `creative-production` application runtime activation;
- eventual retirement of `creative-process-compat.js` only after all actions have owned destinations;
- CAIP and Content service/contract extraction;
- retained historical Build 308 local-signoff caveat;
- keep Packaging business logic out of Core.

### Business & Administration

Still largely planned as a top-level runtime. Accounting is the current extraction path because owned read contracts now exist:

```text
accounting-read             Build 312
accounting-expenses-read    Build 316
```

Marketing, Platform and Administration still need bounded contracts/runtime work before Business & Administration can activate safely.

### Accounting read-time DDL retirement queue

Build 316 establishes the rule:

```text
GET/read paths report schema readiness.
Migrations/readiness tooling creates or repairs schema.
```

Confirmed remaining legacy GET/schema-mutation areas include:

```text
functions/api/admin/accounting-summary.js
functions/api/admin/accounting-writeoffs.js
functions/api/admin/general-ledger-accounts.js
```

Audit/search follow-up also includes:

```text
functions/api/admin/accounting-overhead-allocations.js
functions/api/admin/accounting-overhead-product-allocations.js
functions/api/admin/product-costs.js
```

Recommended next bounded extraction: Accounting write-offs. Keep the corresponding write path separate unless independently reviewed.

## Git/source-control rule

Repository branches observed during Build 316:

```text
main
dev
build291-candidate
build292-candidate
build293-candidate
build294-candidate
```

All four historical `build29x-candidate` branches are fully contained in `dev` (`behind_by=0` relative to `dev`). They are safe retirement candidates, but Build 316 does not delete branches.

Do not create permanent Git branches for Commerce & Operations, Creative & Production, or Business & Administration. Those are independently loadable application modules within one integrated repository/application and compose through Core contracts.

`dev` remains the modularization/integration branch. `main` remains separate. Git branch names are not deployment proof.

## Build 316 safety boundary — proven intact

Build 316 did not modify:

- Core runtime implementation Build 305;
- application-module grouping/definitions;
- Commerce runtime Build 315;
- Operations loader coverage;
- Orders/payment/refund/gift-card APIs;
- Customer Documents behavior;
- Inventory authorities;
- Creative consumers;
- Accounting expense POST semantics;
- other Accounting handlers yet;
- SQL migrations or aggregate schema;
- Cloudflare bindings/config;
- R2;
- Git branch deletion;
- real Production;
- Production-to-Development data copy.

## Next direction

Proceed with the next bounded Accounting read extraction, beginning with `accounting-writeoffs.js`, and continue the Core/module split audit without mixing loader/runtime expansion, write-authority migration, schema parity, or Production promotion into the same build.

## Validation interaction preference

Keep validation concise: default to **one GIT BASH block and one reusable BROWSER DEVTOOLS CONSOLE block** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains separate and must be repaired before any Production business-data copy.

If a read contract reports missing Accounting schema, do not add request-time DDL back to GET. Record the missing tables/columns and resolve them through the separate schema-parity workflow.
