#!/usr/bin/env python3
"""Source gate for Packaging core-first bootstrap ordering."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
native_path = ROOT / 'public/js/modules/packaging/native-client-v298.mjs'
launcher_path = ROOT / 'public/js/admin-packaging-native-client-v298.js'
html_path = ROOT / 'admin/packaging-studio/index.html'

native = native_path.read_text(encoding='utf-8')
launcher = launcher_path.read_text(encoding='utf-8')
html = html_path.read_text(encoding='utf-8')
checks = []

def check(name, condition, detail):
    checks.append((name, bool(condition), detail))

start = native.find('async function readPackaging')
end = native.find('async function writePackaging', start)
body = native[start:end] if start >= 0 and end > start else ''
bootstrap_call = body.find('auth.apiFetch(url)')
blocking_wait = body.find('await waitForContracts()')

check('readPackaging_exists', start >= 0 and end > start, f'start={start} end={end}')
check('core_bootstrap_precedes_owner_contract_wait', bootstrap_call >= 0 and (blocking_wait < 0 or bootstrap_call < blocking_wait), f'bootstrap_call={bootstrap_call} blocking_wait={blocking_wait}')
check('read_does_not_block_on_owner_contract_wait', 'const ready = await waitForContracts()' not in body, 'core Packaging reads must not await owner-contract activation')
check('deferred_owner_contract_refresh_exists', 'function scheduleDeferredContractRefresh()' in native and 'dd:packaging-owner-contracts-ready' in native and "document.getElementById('refreshPackagingStudio')" in native, 'owner contracts should enrich the already-rendered workspace later')
check('pending_contract_state_explicit', "source: 'contract-pending'" in native and 'owner_contracts_pending' in native, 'pending product/inventory/content dropdown state must be observable')
check('writes_remain_modularly_gated', 'async function writePackaging' in native and 'const ready = await waitForContracts();' in native, 'writes remain behind the verified modular runtime')
check('retired_legacy_route_not_named', '/api/admin/packaging-studio' not in native, 'native client must not reintroduce the retired broad endpoint')
check('launcher_cache_bump', 'native-client-v298.mjs?v=441' in launcher, 'launcher must request the repaired native module revision')
check('html_launcher_cache_bump', 'admin-packaging-native-client-v298.js?v=441' in html, 'Packaging page must request the repaired launcher revision')

failed = [row for row in checks if not row[1]]
for name, ok, detail in checks:
    print(f'{"PASS" if ok else "FAIL"} {name}: {detail}')
if failed:
    print(f'Packaging bootstrap resilience gate failed: {len(failed)} checks', file=sys.stderr)
    raise SystemExit(1)
print(f'Packaging bootstrap resilience gate PASS: {len(checks)} checks')
