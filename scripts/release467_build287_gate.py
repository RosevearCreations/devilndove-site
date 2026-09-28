#!/usr/bin/env python3
from pathlib import Path
import json
import subprocess
import sys

R=Path(__file__).resolve().parents[1]
F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok: F.append(msg)

a=j('release467-build287-real-existing-resource-link-evidence-capture.json')
prev=j('release467-build286-creative-process-resource-link-operator-workflow.json')
cur=j('current-development-authority.json')
auth=j('release467-build287-real-existing-link-authorization.json')
doc=t('docs/operations/RELEASE_467_BUILD_287_REAL_EXISTING_RESOURCE_LINK_EVIDENCE_CAPTURE.md')
road=t('docs/operations/RELEASE_467_REAL_INVENTORY_LINKAGE_ACCEPTANCE_AUTONOMOUS_BUILDS_285_289.md')
wf=t('.github/workflows/release467-build287-real-existing-resource-link-evidence-capture.yml')
inv=t('public/js/admin-site-item-inventory.js')
authjs=t('public/js/auth.js')
erg=t('public/js/admin-ergonomics-v237.js')
invapi=t('functions/api/admin/_siteItemInventoryLegacy.js')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('release')==467 and a.get('build')==287 and a.get('title')=='Real Existing Resource-Link Evidence Capture','Build 287 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 287 state mismatch')

p=a.get('predecessor') or {}
q(p.get('build')==286 and p.get('development_sha')=='fe4dff65c47a00fc3c61a6ae48faa26828951898','Build 286 predecessor Development SHA mismatch')
q(p.get('development_tree_sha')=='a5d51c32f7a1e3696cdbfbfe16e204ecb3f419ec','Build 286 predecessor tree mismatch')
q(p.get('production_main_sha')=='11a4924ce8f5a83bc6b688489404140e89456662' and p.get('production_tree_sha')=='a5d51c32f7a1e3696cdbfbfe16e204ecb3f419ec' and p.get('same_tree') is True,'Build 286 Production predecessor mismatch')

q(prev.get('state')=='PRODUCTION_GREEN','Build 286 successor-ingested authority must be Production GREEN')
pf=prev.get('final_closure') or {}
q(pf.get('dev_sha')=='fe4dff65c47a00fc3c61a6ae48faa26828951898' and pf.get('tree_sha')=='a5d51c32f7a1e3696cdbfbfe16e204ecb3f419ec','Build 286 final Development closure missing')
q(int(pf.get('dedicated_gate_run') or 0)==36374225610,'Build 286 final dedicated proof mismatch')
pp=prev.get('production_checkpoint') or {}
q(pp.get('main_sha')=='11a4924ce8f5a83bc6b688489404140e89456662' and pp.get('tree_sha')=='a5d51c32f7a1e3696cdbfbfe16e204ecb3f419ec' and pp.get('state')=='PRODUCTION_GREEN','Build 286 Production checkpoint missing')
q(int(pp.get('production_pages_deploy_run') or 0)==36374409720,'Build 286 Production Pages proof mismatch')
q(int(pp.get('production_live_resource_integrity_run') or 0)==36374501241,'Build 286 Live Resource proof mismatch')
q(int(pp.get('products_browser_proof_run') or 0)==36374501210,'Build 286 Product Browser proof mismatch')
q(int(pp.get('products_route_proof_run') or 0)==36374501223,'Build 286 Product Route proof mismatch')
q(int(pp.get('build_specific_proof_run') or 0)==36374409434,'Build 286 Production dedicated proof mismatch')

e=a.get('evidence_capture') or {}
expected_name='velona 5 LB - Goats MILK Soap Base SLS/SLES free | Melt and Pour | Natural Bars For The Best Result for Soap-making'
q(e.get('state')=='EXACT_DEVELOPMENT_LINK_EVIDENCE_GREEN','Build 287 evidence state is not GREEN')
q(e.get('exact_development_sha')=='561afcb00ad1c7e2c22bb209e5160bbe94709924','Build 287 evidence SHA mismatch')
q(int(e.get('workflow_run') or 0)==36429890733 and int(e.get('artifact_id') or 0)==10973008389,'Build 287 workflow/artifact evidence mismatch')
q(int(e.get('d1_provider_rows_read') or 0)==170 and int(e.get('d1_rows_read_ceiling') or 0)==20000,'Build 287 D1 read evidence mismatch')
q(int(e.get('creative_work_project_id') or 0)==7 and int(e.get('creative_work_event_id') or 0)==2,'Build 287 real Creative Process identity mismatch')
q(int(e.get('site_item_inventory_id') or 0)==2801 and int(e.get('creative_process_resource_link_id') or 0)==1,'Build 287 real Inventory/link identity mismatch')
q(e.get('material_name')==expected_name and e.get('inventory_name')==expected_name and e.get('exact_normalized_name_match') is True,'Build 287 exact material/Inventory identity mismatch')
q(e.get('inventory_source_type')=='supply' and e.get('resource_role')=='material' and e.get('review_status')=='approved','Build 287 real evidence classification mismatch')
q(float(e.get('inventory_on_hand_before') or 0)==1 and float(e.get('inventory_on_hand_after') or 0)==1,'Build 287 reference-only link changed Inventory quantity')
q(int(e.get('mutation_changes') or 0)==1 and e.get('preexisting_link') is False,'Build 287 expected exactly one new identity link')
for k in ('fixture_used','inventory_mutation','inventory_movement','finance_posting'):
    q(e.get(k) is False,f'Build 287 evidence safety drift: {k}')

q(auth.get('owner_authorized') is True and auth.get('environment')=='DEVELOPMENT_ONLY','Build 287 owner authorization missing')
q(auth.get('allowed_mutation')=='creative_process_resource_links only','Build 287 mutation scope drifted')
q(auth.get('creative_work_event_id')==2 and auth.get('site_item_inventory_id')==2801,'Build 287 authorization identity mismatch')
for k in ('inventory_quantity_mutation','inventory_movement','finance_posting','product_owned_inventory','fixture_creation'):
    q(auth.get(k) is False,f'Build 287 authorization safety drift: {k}')

q('Build 287 — Existing Material-to-Inventory Mapping Evidence' in road,'Build 287 roadmap authorization missing')
for token in ('36429890733','10973008389','170 D1 rows_read','creative_process_resource_link_id=1','Build 288'):
    q(token in doc,'Build 287 document missing '+token)

q('d1 execute' not in wf.lower() and '--remote' not in wf.lower(),'Build 287 normal proof must not contact remote D1')
q('release467-exact-sha-proof' in wf,'Build 287 workflow missing exact predecessor proof composition')
q('fe4dff65c47a00fc3c61a6ae48faa26828951898' in wf and '11a4924ce8f5a83bc6b688489404140e89456662' in wf,'Build 287 workflow predecessor SHA binding missing')
q('python scripts/release467_build287_gate.py' in wf,'Build 287 workflow missing dedicated gate')

for token in ('data-field="stock_unit_label"','data-field="usage_unit_label"','data-field="usage_units_per_stock_unit"','data-cost-per-usage','include_history=0','include_link_stats=0','const inventoryPageSize = 40'):
    q(token in inv,'Build 287 Inventory Operations repair missing '+token)
q("requestPath === '/api/auth/me'" in authjs,'Build 287 false-logout repair missing canonical auth verifier')
q("if(mq.matches)table.classList.add('dd-v237-card-mode')" in erg and 'inventoryCardDefault' not in erg,'Build 287 desktop Inventory table default regressed')
q("const linkStatsCte = includeLinkStats" in invapi and "read_profile: 'history_only'" in invapi,'Build 287 low-read Inventory API profile missing')

q("run_current_contract('scripts/release467_build287_gate.py','Release 467 Build 287')" in sysgate,'System Gate missing Build 287')

cb=int(cur.get('build') or 0)
q(cur.get('release')==467 and cb>=287,'Current authority must retain Build 287 or successor')
if cb==287:
    q(cur.get('title')=='Real Existing Resource-Link Evidence Capture' and cur.get('state')=='DEVELOPMENT_GREEN','Current Build 287 pointer mismatch')
    q(cur.get('accepted_dev_sha')=='fe4dff65c47a00fc3c61a6ae48faa26828951898' and cur.get('accepted_dev_tree_sha')=='a5d51c32f7a1e3696cdbfbfe16e204ecb3f419ec','Current Build 287 predecessor acceptance mismatch')
    cp=cur.get('production_checkpoint') or {}
    q(cp.get('main_sha')=='11a4924ce8f5a83bc6b688489404140e89456662' and cp.get('tree_sha')=='a5d51c32f7a1e3696cdbfbfe16e204ecb3f419ec','Current Build 287 Production baseline mismatch')
    q(int(cur.get('next_build') or 0)==288 and cur.get('next_build_title')=='Real Planned-vs-Actual Inventory Acceptance','Current Build 287 successor pointer mismatch')

s=a.get('safety') or {}
q(s.get('development_resource_link_mutation') is True,'Build 287 bounded Development identity-link mutation must be recorded')
for k in ('schema_change','request_time_schema_mutation','development_inventory_quantity_mutation','development_inventory_movement','development_finance_posting','fixture_creation','product_mutation','r2_mutation','provider_execution','provider_publication','payment_or_refund','production_business_data_query','production_business_data_mutation','automatic_production_promotion','secret_capture'):
    q(s.get(k) is False,f'Build 287 safety drift: {k}')

for path in ('public/js/admin-site-item-inventory.js','public/js/auth.js','public/js/admin-ergonomics-v237.js','functions/api/admin/_siteItemInventoryLegacy.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout))

print('RELEASE 467 BUILD 287 REAL EXISTING RESOURCE-LINK EVIDENCE CAPTURE')
if F:
    print('FAIL')
    [print('-',x) for x in F]
    sys.exit(1)
print('PASS')
print('Real Development link: project 7 / event 2 / Supply Inventory 2801 / link 1')
print('D1 evidence: 170 rows_read / 20,000 ceiling')
print('Inventory quantity: 1 -> 1 / fixture: NONE / Finance: NONE')
print('Next: Build 288 — Real Planned-vs-Actual Inventory Acceptance')
