#!/usr/bin/env python3
"""Release 467 Build 273 — Content Studio Standalone-Project Bridge fail-closed gate."""
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build273-content-studio-standalone-project-bridge.json')
p=j('current-development-authority.json')
prev=j('release467-build272-upload-prerequisite-operator-readiness.json')
helper=t('functions/api/_lib/contentAutomationStudio.js')
control=t('functions/api/admin/content-studio.js')
browser=t('public/js/admin-content-studio.js')
doc=t('docs/operations/RELEASE_467_BUILD_273_CONTENT_STUDIO_STANDALONE_PROJECT_BRIDGE.md')
road=t('docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md')
wf=t('.github/workflows/release467-build273-content-studio-standalone-project-bridge.yml')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==273 and a.get('title')=='Content Studio Standalone-Project Bridge','Build 273 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 273 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='7cf4f6858c664a444499245a6b878491dceecb5f','Build 272 Development SHA mismatch')
q(pred.get('production_main_sha')=='e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f','Build 272 Production SHA mismatch')
q(pred.get('tree_sha')=='875f5cf60dd1118036f6bf5a18c0748e6e9b8d71' and pred.get('same_tree') is True,'Build 272 exact-tree mismatch')
q((pred.get('development_proofs') or {}).get('system_gate_run')==36209187858,'Build 272 System proof mismatch')
q((pred.get('development_proofs') or {}).get('dedicated_gate_run')==36209187949,'Build 272 Development dedicated proof mismatch')
q((pred.get('production_proofs') or {}).get('production_pages_deploy_run')==36209298966,'Build 272 Pages proof mismatch')
q((pred.get('production_proofs') or {}).get('build_specific_proof_run')==36209299044,'Build 272 Production dedicated proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 272 authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='7cf4f6858c664a444499245a6b878491dceecb5f','Build 272 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f','Build 272 final Production closure missing')
b=a.get('bridge') or {}
for k in ('creative_process_project_must_exist','existing_caip_workspace_required','exact_one_caip_workspace_required','package_create_or_refresh_idempotent','caip_link_conflict_fail_closed','missing_package_creates_content_package_only','refresh_reuses_existing_content_package','caip_media_reference_only','review_first'):
    q(b.get(k) is True,f'Build 273 bridge invariant missing: {k}')
q(b.get('missing_caip_creates_project') is False and b.get('ambiguous_caip_creates_project') is False,'Build 273 must never fabricate missing/ambiguous CAIP identity')
q(b.get('classification')=='EXISTING_CREATIVE_PROCESS_CAIP_IDENTITY_TO_SINGLE_CONTENT_STUDIO_PACKAGE','Build 273 classification mismatch')
for token in ('inspectCreativeProjectContentStudioBridge','BLOCKED_CAIP_WORKSPACE_MISSING','BLOCKED_CAIP_IDENTITY_AMBIGUOUS','BLOCKED_EXISTING_LINK_CONFLICT','READY_CREATE_PACKAGE','READY_REFRESH_PACKAGE','existing_identity_bridge:true','created_package_for_existing_identity','refreshed_existing_package','duplicate_project_created:false'):
    q(token in helper,f'Build 273 helper contract missing: {token}')
q("WHERE cp.creative_project_id=? AND ca.asset_status<>'archived'" in helper,'Build 273 CAIP media must bind exact existing CAIP project')
q("ON CONFLICT(source_type,source_id) DO UPDATE SET" in helper,'Build 273 Content Studio package must remain idempotent on source identity')
q("INSERT INTO creative_projects" not in helper,'Build 273 helper must not create CAIP projects')
q("INSERT INTO creative_work_projects" not in helper,'Build 273 helper must not create Creative Process projects')
for token in ('bridge_identity: created.bridge_identity','bridge_outcome: created.bridge_outcome','duplicate_project_created: false','CONTENT_STUDIO_BRIDGE_BLOCKED','bridge_blocked: bridgeBlocked'):
    q(token in control,f'Build 273 control-plane contract missing: {token}')
for token in ('data-caip-count','CAIP workspace required','CAIP identity conflict','Create package from existing CAIP','Open CAIP workspace first','Resolve CAIP identity first','No duplicate Creative Process or CAIP project was created'):
    q(token in browser,f'Build 273 operator bridge contract missing: {token}')
for token in ('Build 273 — Content Studio Standalone-Project Bridge','Build 274 — Creative Process Planned-vs-Actual Inventory Lifecycle'):
    q(token in road,f'Roadmap missing {token}')
for token in ('existing Creative Process project','existing CAIP workspace','fails closed','source_type=\'creative_project\'','No uncertain private R2 object is deleted','Build 274'):
    q(token in doc,f'Build 273 document missing {token}')
q('development_sha: 7cf4f6858c664a444499245a6b878491dceecb5f' in wf,'Build 273 workflow Development predecessor drift')
q('production_sha: e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f' in wf,'Build 273 workflow Production predecessor drift')
q('Release 467 Build 272 Upload Prerequisite Operator Readiness' in wf,'Build 273 workflow predecessor proof name drift')
q("run_current_contract('scripts/release467_build273_gate.py','Release 467 Build 273')" in sysgate,'System Gate missing Build 273')
cur=int(p.get('build') or 0)
q(p.get('release')==467 and cur>=273,'Current authority must retain Build 273 or a verified successor')
proj=p.get('caip_content_studio_standalone_project_bridge') or {}
q(proj.get('classification')=='EXISTING_CREATIVE_PROCESS_CAIP_IDENTITY_TO_SINGLE_CONTENT_STUDIO_PACKAGE','Current authority missing Build 273 projection')
q(proj.get('existing_caip_workspace_required') is True and proj.get('duplicate_creative_project_created') is False and proj.get('duplicate_caip_project_created') is False,'Current authority Build 273 identity safety mismatch')
if cur==273:
    q(p.get('title')=='Content Studio Standalone-Project Bridge','Current authority Build 273 title mismatch')
    q(p.get('state')=='DEVELOPMENT_GREEN','Build 273 pointer must retain inherited Development GREEN state')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f','Build 273 candidate must retain exact Build 272 Production baseline')
    q(int(p.get('next_build') or 0)==274 and p.get('next_build_title')=='Creative Process Planned-vs-Actual Inventory Lifecycle','Build 273 successor pointer mismatch')
else:
    q(a.get('state')=='PRODUCTION_GREEN','Build 274+ requires verified Build 273 closure')
    q((a.get('final_closure') or {}).get('dev_sha')=='4d415840158ee83d60eb19346520446cd158e657','Build 273 final Development SHA mismatch')
    q((a.get('final_closure') or {}).get('tree_sha')=='41db192daa04f81ca0bb2ec59ac290a7d4fc8bfb','Build 273 final tree mismatch')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='3c593eee38c7a05d2a5ad4df4a6b274e2275f492','Build 273 final Production SHA mismatch')
    q((a.get('production_checkpoint') or {}).get('tree_sha')=='41db192daa04f81ca0bb2ec59ac290a7d4fc8bfb','Build 273 final Production tree mismatch')
    if cur==274:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='3c593eee38c7a05d2a5ad4df4a6b274e2275f492','Build 274 current Production baseline must be exact Build 273')
        q(int(p.get('next_build') or 0)>=275,'Build 274 must advance beyond Build 274 successor')
    elif cur==275:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='af5e99b3baa1d28f3949e7956905a0325d328d06','Build 275 current Production baseline must be exact Build 274')
        q(int(p.get('next_build') or 0)>=276,'Build 275 must advance beyond Build 275 successor')
    elif cur==276:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='86112270a5b0eb4bdbae4ffd418e34ecfd7b7587','Build 276 current Production baseline must be exact Build 275')
        q(int(p.get('next_build') or 0)>=277,'Build 276 must advance beyond Build 276 successor')
    else:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='1bfcb248a8baf8cea42467a75c0dac53884ec5c3','Build 277+ current Production baseline must be exact Build 276')
        q(int(p.get('next_build') or 0)>=278,'Build 277+ must advance beyond Build 277 successor')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 273 safety drift: {k}')
if F:
    print('RELEASE 467 BUILD 273 CONTENT STUDIO STANDALONE PROJECT BRIDGE: FAIL')
    for x in F: print('-',x)
    sys.exit(1)
print('RELEASE 467 BUILD 273 CONTENT STUDIO STANDALONE PROJECT BRIDGE')
print('PASS')
print('One existing Creative Process identity + one existing CAIP workspace maps to one idempotent Content Studio package.')
print('Missing, ambiguous or conflicting CAIP identity fails closed; no duplicate project identity is fabricated.')
print('Next: Build 274 — Creative Process Planned-vs-Actual Inventory Lifecycle')
