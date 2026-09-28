#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build285-real-inventory-linkage-prerequisite-inventory.json')
prev=j('release467-build284-caip-production-acceptance-closure-outcomes-renewal.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build285_measurement.sql')
doc=t('docs/operations/RELEASE_467_BUILD_285_REAL_INVENTORY_LINKAGE_PREREQUISITE_INVENTORY.md')
wf=t('.github/workflows/release467-build285-real-inventory-linkage-prerequisite-inventory.yml')
api=t('functions/api/admin/creative-project-operations.js')
ui=t('public/js/admin-creative-project-operations-build212.js')
mig=t('migrations/canonical/0012_release467_hybrid_creative_project_operations.sql')
road=t('docs/operations/RELEASE_467_REAL_INVENTORY_LINKAGE_ACCEPTANCE_AUTONOMOUS_BUILDS_285_289.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==285 and a.get('title')=='Real Inventory Linkage Prerequisite Inventory','Build 285 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 285 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='64bc134807fb8a353f2a33c09d4fa7563684339b' and pred.get('development_tree_sha')=='eefd83a3e142c627baa1082238d14a9e73f583e9','Build 284 Development predecessor mismatch')
q(pred.get('production_main_sha')=='0ad2adcec970d3dc96336bdee88192fea32531a9' and pred.get('production_tree_sha')=='eefd83a3e142c627baa1082238d14a9e73f583e9' and pred.get('same_tree') is True,'Build 284 Production predecessor mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 284 successor-ingested authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='64bc134807fb8a353f2a33c09d4fa7563684339b' and (prev.get('final_closure') or {}).get('tree_sha')=='eefd83a3e142c627baa1082238d14a9e73f583e9','Build 284 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='0ad2adcec970d3dc96336bdee88192fea32531a9' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='eefd83a3e142c627baa1082238d14a9e73f583e9','Build 284 Production checkpoint missing')
q(not re.search(r'(?im)^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE|VACUUM|ATTACH|DETACH)\b',sql),'Build 285 measurement SQL contains mutation/DDL')
for token in ('active_material_events','operation_resources_supply_tool','product_resource_links_with_inventory_match','active_supply_tool_inventory','event_operation_link_columns','foreign_key_violations'):
    q(token in sql,'Build 285 measurement missing '+token)
q("action==='save_resource'" in api and 'planning_only:true' in api and 'inventory_mutation:false' in api,'Build 212 planning resource API support missing')
q("action:'save_resource'" in ui and 'Search Inventory' in ui and 'Save planned resource' in ui,'Build 212 operator resource UI support missing')
q('creative_project_operation_resources' in mig,'Build 212 operation-resource schema missing')
m=a.get('measurement') or {}
q(m.get('state') in ('PENDING_EXACT_DEVELOPMENT_MEASUREMENT','EXACT_DEVELOPMENT_MEASURED_GREEN'),'Build 285 measurement state mismatch')
if m.get('state')=='EXACT_DEVELOPMENT_MEASURED_GREEN':
    counts=m.get('counts') or {}
    for k in ('active_material_events','active_operations','operation_resources','operation_resources_supply_tool','active_supply_tool_inventory','product_resource_links','event_operation_link_columns','foreign_key_violations'):
        q(k in counts,'Measured Build 285 count missing '+k)
    q(int(m.get('d1_provider_rows_read') or 0)<=25000,'Build 285 provider read ceiling exceeded')
    q(counts.get('foreign_key_violations')==0,'Build 285 foreign-key violations detected')
    q(m.get('classification') in ('MISSING_REAL_LINKAGE_DATA_AND_EXPLICIT_EVENT_RESOURCE_WORKFLOW','MISSING_REAL_LINKAGE_DATA','PROJECT_LEVEL_RESOURCE_DATA_EXISTS_EXPLICIT_EVENT_LINK_WORKFLOW_MISSING','PREREQUISITES_PRESENT'),'Build 285 classification missing')
    q(isinstance(m.get('missing_data'),bool) and isinstance(m.get('missing_workflow_support'),bool),'Build 285 gap booleans missing')
for token in ('Save planned resource','Data gap','Workflow/schema gap','25,000-row','zero D1 mutation','Build 286'):
    q(token in doc,'Build 285 document missing '+token)
for token in ('development-linkage-prerequisite-measurement','devilndove-dev','25000','release467-build285-real-inventory-linkage-prerequisite-inventory'):
    q(token in wf,'Build 285 workflow missing '+token)
q('Build 285 — Real Inventory Linkage Prerequisite Inventory' in road and 'Build 286 — Creative Process Resource-Link Operator Workflow' in road,'Build 285 roadmap authorization missing')
q("run_current_contract('scripts/release467_build285_gate.py','Release 467 Build 285')" in sysgate,'System Gate missing Build 285')
cur=int(p.get('build') or 0);q(p.get('release')==467 and cur>=285,'Current authority must retain Build 285 or successor')
if cur==285:
    q(p.get('title')=='Real Inventory Linkage Prerequisite Inventory' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 285 pointer mismatch')
    q(p.get('accepted_dev_sha')=='64bc134807fb8a353f2a33c09d4fa7563684339b' and p.get('accepted_dev_tree_sha')=='eefd83a3e142c627baa1082238d14a9e73f583e9','Current Build 285 predecessor mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='0ad2adcec970d3dc96336bdee88192fea32531a9' and (p.get('production_checkpoint') or {}).get('tree_sha')=='eefd83a3e142c627baa1082238d14a9e73f583e9','Current Build 285 Production baseline mismatch')
    q(int(p.get('next_build') or 0)==286 and p.get('next_build_title')=='Creative Process Resource-Link Operator Workflow','Current Build 285 successor pointer mismatch')
    q(p.get('roadmap')=='docs/operations/RELEASE_467_REAL_INVENTORY_LINKAGE_ACCEPTANCE_AUTONOMOUS_BUILDS_285_289.md','Current Build 285 roadmap mismatch')
for k,v in (a.get('safety') or {}).items():q(v is False,f'Build 285 safety drift: {k}')
print('RELEASE 467 BUILD 285 REAL INVENTORY LINKAGE PREREQUISITE INVENTORY')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Measurement:',m.get('state'))
print('Mutation: ZERO / Production business-data query: ZERO')
print('Next: Build 286 — Creative Process Resource-Link Operator Workflow')
