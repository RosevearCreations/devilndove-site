#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
API = (ROOT / 'functions/api/admin/product-costs.js').read_text(encoding='utf-8')
READ = (ROOT / 'functions/api/_lib/accountingProductCostsReadService.js').read_text(encoding='utf-8')

checks=[]
def check(condition,label):
    ok=bool(condition); checks.append(ok); print(('PASS' if ok else 'FAIL')+' — '+label)

print('BUILD 440 PRODUCT COST SCHEMA OWNERSHIP REGRESSION')
print('Remote access: NONE\n')

check('readAccountingProductCosts(db, { limit: 1 })' in API,'POST uses Accounting read contract for schema readiness')
check("code: 'product_cost_schema_not_ready'" in API,'schema-not-ready is explicit and fail-closed')
check("owner: 'accounting'" in API,'schema readiness reports Accounting ownership')
check('request_time_schema_mutation: false' in API,'endpoint explicitly reports no request-time schema mutation')
check(not re.search(r'\bCREATE\s+TABLE\b|\bALTER\s+TABLE\b|\bCREATE\s+INDEX\b',API,re.I),'endpoint contains no CREATE/ALTER/INDEX DDL')
check('ensureTable(' not in API and 'getTableColumnSet(' not in API,'legacy request-time schema repair helpers are removed')
check('INSERT INTO product_costs' in API and '.bind(product_number,cost_per_unit,effective_date || null,notes || null).run()' in API,'write uses fixed migration-owned product_costs columns')
check('assertAccountingPeriodOpen' in API,'Accounting period close guard remains enforced')
check('cost_per_unit < 0' in API,'negative cost is rejected')
check("'product_cost_id'" in READ and "'product_number'" in READ and "'cost_per_unit'" in READ,'Accounting read contract owns required schema columns')
check('schema_ready: false' in READ and 'missing_tables' in READ and 'missing_columns' in READ,'Accounting read contract reports schema gaps without repairing them')
check('request_time_schema_mutation: false' in READ,'Accounting read service also declares zero request-time mutation')

passed=sum(checks)
print(f'\nBUILD 440 PRODUCT COST SCHEMA OWNERSHIP REGRESSION: {passed}/{len(checks)} passed')
raise SystemExit(0 if passed==len(checks) else 1)
