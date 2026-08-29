#!/usr/bin/env python3
"""Release 456 carried-forward gate for Inventory + Tool operational workflow depth."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def run(path):
 p=subprocess.run([sys.executable,str(ROOT/path)],capture_output=True,text=True)
 req(p.returncode==0,f'carried-forward gate failed: {path}\n{p.stdout}\n{p.stderr}')

INV_API='functions/api/admin/inventory-intelligence.js';TOOL_API='functions/api/admin/tool-lifecycle.js'
INV_JS='public/js/admin-inventory-intelligence.js';TOOL_JS='public/js/admin-tool-lifecycle.js'
INV_HTML='admin/inventory-intelligence/index.html';TOOL_HTML='admin/tool-lifecycle/index.html'
for p in (INV_API,TOOL_API,INV_JS,TOOL_JS,INV_HTML,TOOL_HTML):req((ROOT/p).exists(),f'Release 456 workflow asset missing: {p}')
inv_api,tool_api,inv_js,tool_js,inv_html,tool_html=map(read,(INV_API,TOOL_API,INV_JS,TOOL_JS,INV_HTML,TOOL_HTML))
req("const RELEASE = 456" in inv_api,'Inventory Intelligence API originating release must remain 456')
req("const RELEASE=456" in tool_api,'Tool lifecycle API originating release must remain 456')
for marker in ('site_item_inventory','inventory_tool_lifecycle_profiles','inventory_tool_lifecycle_events','tool_lifecycle_ready','tools_service_due','tools_replacement_planning'):
 req(marker in inv_api,f'Inventory Intelligence operational bridge missing {marker}')
for marker in ('SERVICE_EVENTS','acquired_at','warranty_expires_at','last_service_at','next_service_at','service_interval_days','returned_to_service','do_not_reuse','tool_quantity_mutated:false'):
 req(marker in tool_api,f'Tool lifecycle workflow missing {marker}')
req("SERVICE_EVENTS.has(eventType)?1:0" in tool_api and "date(?, '+' || service_interval_days || ' days')" in tool_api,'service events must advance durable service schedule')
req("marked do-not-reuse" in tool_api and "unsafe Tool cannot be saved as active" in tool_api,'Tool reuse/unsafe safety guards missing')
req('site_tool_lifecycle_' not in inv_api and 'site_tool_lifecycle_' not in tool_api,'Release 456 must not introduce a parallel site_tool_lifecycle authority')
for marker in ('iiQueue','Tool Lifecycle','tools_service_due','replacement'):req(marker in inv_js or marker in inv_html,f'Inventory operational UX missing {marker}')
for marker in ('tlSummary','tlAttention','acquired_at','warranty_expires_at','tlOperational','View in Inventory Intelligence'):req(marker in tool_js or marker in tool_html,f'Tool lifecycle UX missing {marker}')
req('/public/js/admin-inventory-intelligence.js?v=456' in inv_html,'Inventory page must retain Release 456 runtime')
req('/public/js/admin-tool-lifecycle.js?v=456' in tool_html,'Tool page must retain Release 456 runtime')
for html,path in ((inv_html,INV_HTML),(tool_html,TOOL_HTML)):
 req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{path} must contain exactly one H1')
 req('noindex,nofollow' in html,f'{path} must remain private/noindex')
 req('data-admin-module="storefront"' in html,f'{path} must remain Storefront-module owned')
 req('data-admin-workspace-status' in html,f'{path} must preserve shared workspace state')

release=json.loads(read('development-release.json'));current=int(release.get('release') or 0)
req(release.get('environment')=='development' and release.get('branch')=='dev' and release.get('pages_project')=='devilndove-site-dev','Release 456 authority must remain Development/dev')
req(current>=456,'current release cannot predate Release 456')
history={x.get('release'):x for x in release.get('release_history',[])}
if current==456:
 req(release.get('label')=='Inventory & Tool Operational Workflow Depth','Release 456 label drifted')
else:
 r456=history.get(456,{})
 req(r456.get('state')=='complete_source_proven_no_new_d1_migration','Release 456 completed history must be carried forward')
 req(r456.get('focused_source_gate_run')==33263530207 and r456.get('system_gate_run')==33263530221,'Release 456 exact-head CI proof drifted')
req(release.get('current_release_migrations')==[],'current source-only release must not introduce a migration')
d1=release.get('development_infrastructure',{}).get('d1',{})
req(d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa','Development D1 identity drifted')
req(int(d1.get('schema_current_through_release') or 0)>=453,'Release 456 must carry verified D1 schema through at least 453')
db=release.get('current_release_database_state',{})
req(db.get('new_migration_required') is False and int(db.get('last_verified_schema_release') or 0)>=453 and db.get('historical_migration_replay') is False,'D1 state must remain source-only / verified through 453 or later')
r453=history.get(453,{})
req(r453.get('mutation_workflow_run')==33258377328 and r453.get('verification_workflow_run')==33258415391,'Release 453 D1 evidence drifted')
policy=release.get('release_policy',{})
req(policy.get('production_promotion')=='closed' and policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','Production/provider boundaries must remain closed')
req(policy.get('current_release_d1_migration_required') is False,'current source-only policy drifted')
req(not list((ROOT/'migrations/dev').glob('*release456*')),'Release 456 migration file must not exist')
batch=release.get('release456_batch',[])
req(len(batch)==12 and all(x.get('status')=='implemented' for x in batch),'Release 456 batch must remain complete')
authority=read('functions/api/_lib/releaseAuthority.js')
m=re.search(r'CURRENT_RELEASE\s*=\s*(\d+)',authority);req(bool(m) and int(m.group(1))>=456,'shared runtime release authority cannot regress below 456')
workflow=read('.github/workflows/system-gate.yml')
req('python scripts/release456_inventory_tool_workflow_gate.py' in workflow,'System Gate must retain Release 456')
run('scripts/release455_storefront_discovery_gate.py')
run('scripts/release448_inventory_intelligence_gate.py')
run('scripts/release448_tool_lifecycle_gate.py')
print('RELEASE 456 INVENTORY + TOOL WORKFLOW: CARRIED FORWARD')
print(f'Current release: {current}')
print('Inventory authority: site_item_inventory')
print('Tool lifecycle authority: inventory_tool_lifecycle_profiles + inventory_tool_lifecycle_events')
print('Parallel lifecycle authority: NONE')
print('Development D1 schema: CARRIED FORWARD / VERIFIED THROUGH RELEASE 453 OR LATER')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('RELEASE 456 INVENTORY + TOOL WORKFLOW GATE: PASS')
