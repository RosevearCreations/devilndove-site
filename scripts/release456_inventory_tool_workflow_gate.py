#!/usr/bin/env python3
"""Carried-forward Release 456 Inventory + Tool operational workflow authority gate."""
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def run(path):
 p=subprocess.run([sys.executable,str(ROOT/path)],capture_output=True,text=True);req(p.returncode==0,f'carried-forward gate failed: {path}\n{p.stdout}\n{p.stderr}')
INV_API='functions/api/admin/inventory-intelligence.js';TOOL_API='functions/api/admin/tool-lifecycle.js';INV_JS='public/js/admin-inventory-intelligence.js';TOOL_JS='public/js/admin-tool-lifecycle.js';INV_HTML='admin/inventory-intelligence/index.html';TOOL_HTML='admin/tool-lifecycle/index.html'
for p in (INV_API,TOOL_API,INV_JS,TOOL_JS,INV_HTML,TOOL_HTML):req((ROOT/p).exists(),f'Release 456 asset missing: {p}')
inv_api,tool_api,inv_js,tool_js,inv_html,tool_html=map(read,(INV_API,TOOL_API,INV_JS,TOOL_JS,INV_HTML,TOOL_HTML))
req('const RELEASE = 456' in inv_api,'Inventory Intelligence provenance must remain 456');req('const RELEASE=456' in tool_api,'Tool lifecycle provenance must remain 456')
for marker in ('site_item_inventory','inventory_tool_lifecycle_profiles','inventory_tool_lifecycle_events','tool_lifecycle_ready','tools_service_due','tools_replacement_planning'):req(marker in inv_api,f'Inventory Intelligence missing {marker}')
for marker in ('SERVICE_EVENTS','acquired_at','warranty_expires_at','last_service_at','next_service_at','service_interval_days','returned_to_service','do_not_reuse','tool_quantity_mutated:false'):req(marker in tool_api,f'Tool lifecycle missing {marker}')
req('site_tool_lifecycle_' not in inv_api and 'site_tool_lifecycle_' not in tool_api,'parallel Tool lifecycle authority forbidden')
for html,path in ((inv_html,INV_HTML),(tool_html,TOOL_HTML)):
 req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{path} must contain exactly one H1');req('noindex,nofollow' in html,f'{path} must remain private/noindex');req('data-admin-module="storefront"' in html,f'{path} must remain Storefront owned');req('data-admin-workspace-status' in html,f'{path} must retain workspace status')
release=json.loads(read('development-release.json'));current=int(release.get('release') or 0);hist={x.get('release'):x for x in release.get('release_history',[])}
req(release.get('environment')=='development' and release.get('branch')=='dev' and release.get('pages_project')=='devilndove-site-dev','authority must remain Development/dev');req(current>=456,'current release cannot predate 456')
if current>456:
 r=hist.get(456,{});req(r.get('state')=='complete_source_proven_no_new_d1_migration','Release 456 completed history missing');req(r.get('focused_source_gate_run')==33263530207 and r.get('system_gate_run')==33263530221,'Release 456 exact-head CI proof drifted')
d1=release.get('development_infrastructure',{}).get('d1',{});req(d1.get('database_name')=='devilndove-dev' and d1.get('database_id')=='dbc1615b-dcbe-4951-973b-b47c99c73bfa' and int(d1.get('schema_current_through_release') or 0)>=453,'Development D1 identity/schema drifted')
req(release.get('current_release_database_state',{}).get('historical_migration_replay') is False,'historical migration replay must remain forbidden')
r453=hist.get(453,{});req(r453.get('mutation_workflow_run')==33258377328 and r453.get('verification_workflow_run')==33258415391,'Release 453 D1 evidence drifted')
policy=release.get('release_policy',{});req(policy.get('production_promotion')=='closed' and policy.get('provider_execution')=='closed' and policy.get('provider_publication')=='closed','Production/provider boundaries must remain closed')
req(not list((ROOT/'migrations/dev').glob('*release456*')),'Release 456 itself must remain a no-migration release')
req(len(release.get('release456_batch',[]))==12 and all(x.get('status')=='implemented' for x in release.get('release456_batch',[])),'Release 456 batch history incomplete')
authority=read('functions/api/_lib/releaseAuthority.js');m=re.search(r'CURRENT_RELEASE\s*=\s*(\d+)',authority);req(bool(m) and int(m.group(1))>=456,'shared runtime release authority cannot regress below 456')
workflow=read('.github/workflows/system-gate.yml');req('python scripts/release456_inventory_tool_workflow_gate.py' in workflow,'System Gate must retain Release 456')
run('scripts/release455_storefront_discovery_gate.py');run('scripts/release448_inventory_intelligence_gate.py');run('scripts/release448_tool_lifecycle_gate.py')
print('RELEASE 456 INVENTORY + TOOL WORKFLOW: CARRIED FORWARD')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('RELEASE 456 INVENTORY + TOOL WORKFLOW GATE: PASS')
