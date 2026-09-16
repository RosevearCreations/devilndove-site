#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

def read(path):
    file = ROOT / path
    if not file.is_file():
        FAIL.append(f'missing required file: {path}')
        return ''
    return file.read_text(encoding='utf-8', errors='replace')

def load(path):
    try:
        data = json.loads(read(path))
        return data if isinstance(data, dict) else {}
    except Exception as error:
        FAIL.append(f'invalid JSON {path}: {error}')
        return {}

def req(condition, message):
    if not condition:
        FAIL.append(message)

manifest = load('release467-build161-universal-search-recent-work-command-centre.json')
req(manifest.get('release') == 467 and manifest.get('build') == 161, 'Build 161 release identity missing')
req(manifest.get('title') == 'Universal Search, Recent Work & Command Centre QoL', 'Build 161 title drifted')
for key in ('request_time_schema_mutation','schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','product_mutation_authorized','provider_execution_authorized','provider_publication_authorized','payment_mutation_authorized','refund_mutation_authorized','accounting_posting_authorized','production_business_data_overwrite'):
    req((manifest.get('safety') or {}).get(key) is False, f'Build 161 safety boundary drift: {key}')

canonical = load('migrations/canonical/manifest.json')
expected = ['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql','0005_release467_inventory_process_assignment.sql']
req([row.get('file') for row in canonical.get('migrations', []) if isinstance(row, dict)] == expected, 'Build 161 must not add or remove canonical migrations')

middleware = read('functions/_middleware.js')
for token in ('ADMIN_QOL_REVISION', '467b161-universal-search-v1', 'adminQolMarkup()', 'admin-universal-search-v161.css', 'admin-universal-search-v161.js', 'isAdminRuntimePath(pathname)', 'productsPlatformMarkup()'):
    req(token in middleware, f'Build 161 middleware missing: {token}')
req(middleware.count('adminQolMarkup()') >= 2, 'Build 161 QoL must cover general Admin HTML and Products static fast path')

client = read('public/js/admin-universal-search-v161.js')
for token in ('R467B161_UNIVERSAL_SEARCH_QOL_V1','/data/admin-navigation-modules.json','/api/admin/universal-search','dd_admin_recent_work_v161','dd_admin_favourites_v161','Ctrl/⌘ K','event.ctrlKey || event.metaKey','event.key === \'/\'','dd_return','returnWrapped','toggleFavourite','rememberCurrent','universalCommandCentreMount','ArrowDown','ArrowUp'):
    req(token in client, f'Build 161 client missing: {token}')
for forbidden in ("method:'POST'", 'method:"POST"', "method: 'POST'", 'setInterval('):
    req(forbidden not in client, f'Build 161 client gained forbidden active behavior: {forbidden}')

endpoint = read('functions/api/admin/universal-search.js')
for token in ('Release 467 Build 161','getAdminUserFromRequest','getDb','MAX_RESULTS = 30','MAX_PER_SOURCE = 6','min_query_length:2','products','site_item_inventory','creative_projects','orders','custom_requests','content_projects','media_assets','PRAGMA table_info','sqlite_master','read_only:true'):
    req(token in endpoint, f'Build 161 universal search endpoint missing: {token}')
for forbidden in ('INSERT ', 'UPDATE ', 'DELETE ', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'bucket.put(', 'bucket.delete('):
    req(forbidden not in endpoint.upper() if forbidden.isupper() else forbidden not in endpoint, f'Build 161 search endpoint contains mutation token: {forbidden.strip()}')

css = read('css/admin-universal-search-v161.css')
for token in ('.dd-v161-launcher','.dd-v161-overlay','.dd-v161-panel','.dd-v161-return','.dd-v161-command-grid','@media(max-width:680px)'):
    req(token in css, f'Build 161 CSS missing: {token}')

command = read('admin/command-center/index.html')
for token in ('Release 467 Build 161','universalCommandCentreMount','universal Admin search surface','context-preserving return links'):
    req(token in command, f'Build 161 Command Centre missing: {token}')
req(command.lower().count('<h1') == 1, 'Build 161 Command Centre must retain exactly one H1')

nav = load('data/admin-navigation-modules.json')
nav_text = json.dumps(nav)
for token in ('Products','Catalog & Inventory','Inventory Operations','Tool Lifecycle','Creative Project Workflow','Orders & Payments','Custom Requests','Content Studio','Website Media & Content Studio','Accounting','Command Center'):
    req(token in nav_text, f'Canonical navigation authority missing Build 161 search destination: {token}')

for path in ('functions/_middleware.js','functions/api/admin/universal-search.js','public/js/admin-universal-search-v161.js'):
    result = subprocess.run(['node','--check',str(ROOT / path)], cwd=ROOT, capture_output=True, text=True)
    req(result.returncode == 0, f'JavaScript syntax failed for {path}: {(result.stderr or result.stdout).strip()}')

if FAIL:
    print('FAIL Release 467 Build 161 — Universal Search, Recent Work & Command Centre QoL')
    for index, item in enumerate(FAIL, 1):
        print(f'{index:03d}. {item}')
    sys.exit(1)

print('PASS Release 467 Build 161 — Universal Search, Recent Work & Command Centre QoL')
print('navigation_authority=EXISTING_ADMIN_NAVIGATION_MANIFEST')
print('live_record_search=AUTHENTICATED_BOUNDED_GET_ONLY')
print('recent_work_and_favourites=BROWSER_LOCAL_ONLY')
print('keyboard_access=CTRL_CMD_K_AND_SLASH')
print('return_context=SAME_ORIGIN_ADMIN_ONLY')
print('schema_d1_write_r2_provider_payment_refund_accounting_mutation=NONE')
