#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build241-cross-authority-handoff-simplification.json')
p=j('current-development-authority.json')
prev=j('release467-build240-api-read-budget-cache-batch-streamlining.json')
js=t('public/js/admin-handoff-v241.js')
mw=t('functions/_middleware.js')
road=t('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('build')==241 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 241 authority identity/state mismatch')
if a.get('state')=='PRODUCTION_GREEN':
    q((a.get('final_closure') or {}).get('dev_sha')=='82688fbe6a74e235b85b56bc21f82380131bb3bc','Build 241 successor closure must retain exact final dev SHA')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='87778556ac99c1e82217c4d2d45ead5bf1ef1b88','Build 241 successor closure must retain exact Production main')
q((a.get('starting_point') or {}).get('development',{}).get('sha')=='3fb60a9f3be8c40ca415ecd3cdcf7a44bff081d8','Build 241 starting dev SHA mismatch')
q((a.get('starting_point') or {}).get('development',{}).get('tree')=='6388a8259bdf4902e220fed5e1dd9f21766c2357','Build 241 starting dev tree mismatch')
q((a.get('starting_point') or {}).get('production',{}).get('main_sha')=='a9efe9826c6ad7e400fa174f7cd6a8e6d980c452','Build 241 starting Production main mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 240 predecessor must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='3fb60a9f3be8c40ca415ecd3cdcf7a44bff081d8','Build 240 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='a9efe9826c6ad7e400fa174f7cd6a8e6d980c452','Build 240 production checkpoint missing')
q(int(p.get('build') or 0)>=241 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must retain Build 241 or a verified successor')
if int(p.get('build') or 0)==241:
    q(p.get('next_build')==242,'Build 241 successor pointer mismatch')
    q(p.get('accepted_dev_sha')=='3fb60a9f3be8c40ca415ecd3cdcf7a44bff081d8','Current Build 241 must inherit exact Build 240 dev SHA')
    q(p.get('accepted_dev_tree_sha')=='6388a8259bdf4902e220fed5e1dd9f21766c2357','Current Build 241 must inherit exact Build 240 tree')
else:
    q((a.get('final_closure') or {}).get('dev_sha')=='82688fbe6a74e235b85b56bc21f82380131bb3bc','Build 242+ must retain exact Build 241 Development closure')
for token in (
    "DDAdminHandoffV241","product_id","creative_project_id","inventory_id","custom_request_id",
    "content_project_id","creation_id","handoff_from","handoff_label","return_to",
    "u.origin!==location.origin","!u.pathname.startsWith('/admin/')","copies_authoritative_records:false"
):
    q(token in js,f'Build 241 handoff client missing {token}')
q("if(!u.searchParams.has(key) && currentIds[key])" in js,'Build 241 must not overwrite destination identifiers')
q("data-dd-admin-handoff-v241" in mw and "admin-handoff-v241.js" in mw,'Build 241 shared Admin bootstrap missing')
q("ADMIN_HANDOFF_REVISION = '467b241-cross-authority-handoff-v1'" in mw,'Build 241 revision identity missing')
q('Build 242 — Release, Diagnostics & Evidence Streamlining' in road,'Build 242 successor missing')
q("run_current_contract('scripts/release467_build241_gate.py','Release 467 Build 241')" in sysgate,'System Gate must invoke Build 241')
for k in ('automatic_business_action','new_api_authority','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','schema_change','copied_authoritative_business_records'):
    q(a.get('safety',{}).get(k) is False,f'Build 241 safety drift: {k}')
print('RELEASE 467 BUILD 241 CROSS-AUTHORITY HANDOFF SIMPLIFICATION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
