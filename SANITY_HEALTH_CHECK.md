# Sanity Health Check — Development Build 446

Build 446 is the current Development release. Build 445 at `f50e6d61deb31de9c17b12b55d6649a7779fdb95` is the previous fully green/deployed checkpoint.

## Canonical source gate

```bash
python scripts/repository_forward_sanity.py
python scripts/build443_home_carousel_regression.py
python scripts/build442_it_platform_migration_regression.py
python scripts/build440_product_inventory_tools_source_gate.py
node --check functions/api/admin/infrastructure-readiness.js
git diff --check
```

## Required repository state

- `docs/archive` and `docs/releases`: **ABSENT**
- root historical `BUILD*.md`: **ABSENT**
- superseded `database_build*.sql`: **ABSENT**
- inactive build-numbered scripts: **ABSENT**
- `database_full_schema.sql`: **PRESENT**
- retained guarded Build 440/442/443 D1 recovery: **PRESENT**
- Build 446 new D1 SQL: **NONE**

Current live-evidence HOLDs: carousel/I.T. schema authority where still missing, Stripe, PayPal and CAIP private media. CI must never apply D1 or mutate providers/Production.
