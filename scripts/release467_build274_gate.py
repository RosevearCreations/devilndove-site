#!/usr/bin/env python3
"""Release 467 Build 274 — Creative Process Planned-vs-Actual Inventory Lifecycle gate."""
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build274-creative-process-planned-vs-actual-inventory-lifecycle.json')
p=j('current-development-authority.json')
prev=j('release467-build273-content-studio-standalone-project-bridge.json')
api=t('functions/api/admin/creative-process.js')
compat=t('functions/api/admin/creative-process-compat.js')
ui=t('public/js/admin-creative-process.js')
post=t('functions/api/_lib/creativeInventoryPostConsumer.js')
reverse=t('functions/api/_lib/creativeInventoryReversalConsumer.js')
doc=t('docs/operations/RELEASE_467_BUILD_274_CREATIVE_PROCESS_PLANNED_VS_ACTUAL_INVENTORY_LIFECYCLE.md')
road=t('docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md')
wf=t('.github/workflows/release467-build274-creative-process-planned-vs-actual-inventory-lifecycle.yml')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==274 and a.get('title')=='Creative Process Planned-vs-Actual Inventory Lifecycle','Build 274 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 274 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='4d415840158ee83d60eb19346520446cd158e657','Build 273 Development SHA mismatch')
q(pred.get('production_main_sha')=='3c593eee38c7a05d2a5ad4df4a6b274e2275f492','Build 273 Production SHA mismatch')
q(pred.get('tree_sha')=='41db192daa04f81ca0bb2ec59ac290a7d4fc8bfb' and pred.get('same_tree') is True,'Build 273 exact-tree mismatch')
q((pred.get('development_proofs') or {}).get('system_gate_run')==36210339968,'Build 273 System proof mismatch')
q((pred.get('development_proofs') or {}).get('dedicated_gate_run')==36210339832,'Build 273 Development dedicated proof mismatch')
q((pred.get('production_proofs') or {}).get('production_pages_deploy_run')==36210476372,'Build 273 Pages proof mismatch')
q((pred.get('production_proofs') or {}).get('build_specific_proof_run')==36210476306,'Build 273 Production dedicated proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 273 authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='4d415840158ee83d60eb19346520446cd158e657','Build 273 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='3c593eee38c7a05d2a5ad4df4a6b274e2275f492','Build 273 final Production closure missing')
life=a.get('lifecycle') or {}
q(life.get('classification')=='PLANNED_ESTIMATES_SEPARATE_FROM_REVIEWED_AND_POSTED_ACTUALS','Build 274 lifecycle classification mismatch')
for k in ('planned_event_editable_until_posted','explicit_post_required','posted_actual_direct_edit_allowed','history_preserved','inventory_owned_compensating_movement'):
    expected=False if k=='posted_actual_direct_edit_allowed' else True
    q(life.get(k) is expected,f'Build 274 lifecycle invariant mismatch: {k}')
q(life.get('planned_material_estimates_move_inventory') is False,'Planned estimates must not move Inventory')
q(life.get('inventory_post_authority')=='inventory-post' and life.get('inventory_reversal_authority')=='inventory-reverse','Build 274 Inventory authority mismatch')
for token in ("'post_material_inventory'","'record_inventory_use'","'correct_inventory_use'","'void_event'","reverseCreativeInventoryThroughContract","handleVoidEvent","planned_actual_inventory_lifecycle","PLANNED_ESTIMATES_SEPARATE_FROM_REVIEWED_AND_POSTED_ACTUALS","posted_voids_use_compensating_reversal:true"):
    q(token in api,f'Build 274 API contract missing: {token}')
q("if(post&&post.posting_status!=='reversed') throw new Error('This entry has posted inventory." in compat,'Posted timeline edit must remain blocked in compatibility layer')
q("postCreativeInventoryThroughContract" in post and "CONTRACT_ID = 'inventory-post'" in post,'Inventory-owned posting consumer contract missing')
q("reverseCreativeInventoryThroughContract" in reverse and "CONTRACT_ID = 'inventory-reverse'" in reverse,'Inventory-owned reversal consumer contract missing')
for token in ('Planned estimate — inventory unchanged','Reviewed actual — not posted','Actual inventory posted','Build 274 lifecycle','Inventory-owned compensating ledger'):
    q(token in ui,f'Build 274 operator lifecycle label missing: {token}')
for token in ('Build 274 — Creative Process Planned-vs-Actual Inventory Lifecycle','Build 275 — CAIP Production Acceptance & Outcomes Renewal'):
    q(token in road,f'Roadmap missing {token}')
for token in ('Planned estimate','Reviewed actual, not posted','Posted actual','Corrected actual','Voided posted entry','content-only','Inventory remains movement authority','Build 275'):
    q(token in doc,f'Build 274 document missing {token}')
q('development_sha: 4d415840158ee83d60eb19346520446cd158e657' in wf,'Build 274 workflow Development predecessor drift')
q('production_sha: 3c593eee38c7a05d2a5ad4df4a6b274e2275f492' in wf,'Build 274 workflow Production predecessor drift')
q('Release 467 Build 273 Content Studio Standalone Project Bridge' in wf,'Build 274 workflow predecessor proof name drift')
q("run_current_contract('scripts/release467_build274_gate.py','Release 467 Build 274')" in sysgate,'System Gate missing Build 274')
cur=int(p.get('build') or 0)
q(p.get('release')==467 and cur>=274,'Current authority must retain Build 274 or a verified successor')
q(p.get('state')=='DEVELOPMENT_GREEN','Build 274+ pointer must retain inherited Development GREEN state')
if cur==274:
    q(p.get('title')=='Creative Process Planned-vs-Actual Inventory Lifecycle','Current authority Build 274 title mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='3c593eee38c7a05d2a5ad4df4a6b274e2275f492','Build 274 candidate must retain exact Build 273 Production baseline')
    q(int(p.get('next_build') or 0)==275 and p.get('next_build_title')=='CAIP Production Acceptance & Outcomes Renewal','Build 274 successor pointer mismatch')
else:
    q(a.get('state')=='PRODUCTION_GREEN','Build 274 successor-ingested authority must be Production GREEN')
    q((a.get('final_closure') or {}).get('dev_sha')=='434a267a5598439103f6942d1b7f58a7ce04dba6' and (a.get('final_closure') or {}).get('tree_sha')=='8d69b22f4634b70f3b10f247e42e0ca2165a4ccf','Build 274 final Development closure mismatch')
    q((a.get('production_checkpoint') or {}).get('main_sha')=='af5e99b3baa1d28f3949e7956905a0325d328d06' and (a.get('production_checkpoint') or {}).get('tree_sha')=='8d69b22f4634b70f3b10f247e42e0ca2165a4ccf','Build 274 final Production closure mismatch')
    if cur==275:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='af5e99b3baa1d28f3949e7956905a0325d328d06','Build 275 current Production baseline must be exact Build 274')
        q(int(p.get('next_build') or 0)>=276,'Build 275 must advance beyond Build 275 successor')
    elif cur==276:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='86112270a5b0eb4bdbae4ffd418e34ecfd7b7587','Build 276 current Production baseline must be exact Build 275')
        q(int(p.get('next_build') or 0)>=277,'Build 276 must advance beyond Build 276 successor')
    else:
        q((p.get('production_checkpoint') or {}).get('main_sha')=='1bfcb248a8baf8cea42467a75c0dac53884ec5c3','Build 277+ current Production baseline must be exact Build 276')
        q(int(p.get('next_build') or 0)>=278,'Build 277+ must advance beyond Build 277 successor')
proj=p.get('creative_process_planned_vs_actual_inventory_lifecycle') or {}
q(proj.get('classification')=='PLANNED_ESTIMATES_SEPARATE_FROM_REVIEWED_AND_POSTED_ACTUALS','Current authority missing Build 274 projection')
q(proj.get('planned_material_estimates_move_inventory') is False and proj.get('posted_actuals_direct_edit_allowed') is False and proj.get('voided_and_corrected_history_preserved') is True,'Current authority Build 274 lifecycle safety mismatch')
for k,v in (a.get('safety') or {}).items(): q(v is False,f'Build 274 safety drift: {k}')
if F:
    print('RELEASE 467 BUILD 274 CREATIVE PROCESS PLANNED VS ACTUAL INVENTORY LIFECYCLE: FAIL')
    for x in F: print('-',x)
    sys.exit(1)
print('RELEASE 467 BUILD 274 CREATIVE PROCESS PLANNED VS ACTUAL INVENTORY LIFECYCLE')
print('PASS')
print('Planned estimates remain non-posting; reviewed actuals require explicit Inventory posting.')
print('Posted corrections and voids preserve history through Inventory-owned compensating reversals.')
print('Next: Build 275 — CAIP Production Acceptance & Outcomes Renewal')
