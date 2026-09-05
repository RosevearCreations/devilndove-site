#!/usr/bin/env python3
"""Release-neutral guard for the active Reliability / Operational Health surface."""
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []


def req(ok, msg):
    if not ok:
        FAIL.append(msg)


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def load(path):
    return json.loads(read(path))


pointer = load('current-development-authority.json')
page = read('admin/reliability/index.html')
client = read('public/js/admin-current-reliability.js')
endpoint = read('functions/api/admin/current-reliability.js')
helper = read('functions/api/_lib/currentReliability.js')
legacy_client = read('public/js/admin-release466-reliability.js')
legacy_endpoint = read('functions/api/admin/release466-reliability.js')
legacy_helper = read('functions/api/_lib/release466Reliability.js')

pointer_release = int(pointer.get('release') or 0)
pointer_build = int(pointer.get('build') or 0)
helper_release = re.search(r'CURRENT_RELIABILITY_RELEASE\s*=\s*(\d+)', helper)
helper_build = re.search(r'CURRENT_RELIABILITY_BUILD\s*=\s*(\d+)', helper)
active_release = int(helper_release.group(1)) if helper_release else 0
active_build = int(helper_build.group(1)) if helper_build else 0

req(pointer_release == 467, 'current Development pointer must remain Release 467')
req(active_release == pointer_release, 'active reliability release must match current Development release')
req(active_build in (pointer_build, pointer_build + 1), 'active reliability build must be current pointer build or the in-flight next build')
req(active_build >= pointer_build, 'active reliability surface may never lag the current Development build')
req('CURRENT_READ_ONLY' in helper, 'current reliability helper must identify its read-only state')
req("'current-development-authority.json'" in helper, 'current reliability helper must name canonical current authority')
req("production_promotion_proof_count: 4" in helper, 'current reliability helper must preserve four-proof Production promotion')
req("rollback_readiness: 'release-neutral-read-only'" in helper, 'current reliability helper must preserve release-neutral read-only rollback readiness')
req("inherited_engine_role: 'HISTORICAL_REGRESSION_COMPATIBILITY'" in helper, 'legacy reliability engine must be explicitly historical compatibility only')

req('/api/admin/current-reliability' in client, 'active reliability client must call the current endpoint')
req('/api/admin/release466-reliability' not in client, 'active reliability client must not call the historical endpoint')
req('Release 466 Build 1 reliability snapshot loaded' not in client, 'active reliability client must not present stale Build 1 truth')
req('Production promotion proofs' in client and 'Rollback readiness' in client, 'active reliability client must expose current release safeguards')

req('onRequestGet' in endpoint, 'current reliability endpoint must expose GET')
for method in ('onRequestPost', 'onRequestPut', 'onRequestPatch', 'onRequestDelete'):
    req(method not in endpoint, f'current reliability endpoint must remain read-only ({method} found)')
req("from '../_lib/currentReliability.js'" in endpoint, 'current endpoint must use the current reliability projection')
req("mutation_capability: 'none'" in endpoint, 'current endpoint must explicitly expose no mutation capability')

req(len(re.findall(r'<h1(?:\s|>)', page, re.I)) == 1, 'active Reliability page must contain exactly one H1')
req(f'Release {active_release} • Build {active_build}' in page, 'active Reliability page identity must match current reliability projection')
req('/public/js/admin-current-reliability.js' in page, 'active Reliability page must load the current client')
req('/public/js/admin-release466-reliability.js' not in page, 'active Reliability page must not load the historical client')
req('Loading Release 466 reliability snapshot' not in page, 'active Reliability page still presents stale Release 466 loading truth')
req('read-only' in page.lower(), 'active Reliability page must explain its read-only boundary')

# Historical Release 466 evidence remains intact for its dedicated regression gate.
req('/api/admin/release466-reliability' in legacy_client, 'historical Release 466 client contract drifted')
req('release:466' in legacy_endpoint and 'build:1' in legacy_endpoint, 'historical Release 466 endpoint identity drifted')
req('loadRelease466Reliability' in legacy_helper and 'release:466' in legacy_helper and 'build:1' in legacy_helper, 'historical Release 466 reliability engine drifted')

if FAIL:
    print('CURRENT RELIABILITY TRUTH GATE: FAIL')
    for item in FAIL:
        print('-', item)
    sys.exit(1)
print('CURRENT RELIABILITY TRUTH GATE: PASS')
