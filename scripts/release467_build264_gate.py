#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build264-refinement-outcomes-renewal-iii.json')
prev=j('release467-build263-release-efficiency-read-budget-outcome-verification.json')
p=j('current-development-authority.json')
oldroad=t('docs/operations/RELEASE_467_RELEASE_EFFICIENCY_READ_PATH_AUTONOMOUS_BUILDS_257_264.md')
road=t('docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md')
doc=t('docs/operations/RELEASE_467_BUILD_264_REFINEMENT_OUTCOMES_RENEWAL_III.md')
caip269=t('docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md')
caipreadme=t('docs/creative-asset-intelligence-platform/README.md')
caipguide=t('docs/creative-asset-intelligence-platform/18_Operator_Workflow_Guide.md')
delivery=t('docs/creative-asset-intelligence-platform/10_Delivery_Roadmap.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('build')==264 and a.get('state') in ('DEVELOPMENT_CANDIDATE','PRODUCTION_GREEN'),'Build 264 identity/state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='ea930cd5c52e0d4f1d55fd9645fc24f5865900f2','Build 263 exact Development SHA missing')
q(pred.get('development_tree_sha')=='e536e198fdb5f44b4430ae2d503e15731f2c9109','Build 263 exact Development tree missing')
q(pred.get('production_main_sha')=='7ee1ac700f451d35a20ff3d667c405086c5512ef','Build 263 exact Production main missing')
q(pred.get('production_tree_sha')=='e536e198fdb5f44b4430ae2d503e15731f2c9109' and pred.get('same_tree') is True,'Build 263 exact-tree continuity missing')
q(prev.get('state')=='PRODUCTION_GREEN','Build 263 successor-ingested Production closure missing')
q((prev.get('final_closure') or {}).get('dev_sha')=='ea930cd5c52e0d4f1d55fd9645fc24f5865900f2','Build 263 final Development closure missing')
q((prev.get('final_closure') or {}).get('dedicated_gate_run')==36136927079,'Build 263 dedicated Development proof missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='7ee1ac700f451d35a20ff3d667c405086c5512ef','Build 263 Production checkpoint missing')
q((prev.get('production_checkpoint') or {}).get('build_specific_proof_run')==36137622753,'Build 263 Production-specific proof missing')

r=a.get('review') or {};eff=r.get('release_efficiency') or {};rb=r.get('read_budget') or {};ce=r.get('caip_repository_evidence') or {}
q(r.get('source_builds')==[257,258,259,260,261,262,263],'Build 264 source-build span mismatch')
q(r.get('all_source_builds_production_green') is True and r.get('exact_tree_closure_preserved') is True,'Build 264 closure continuity missing')
q(float(eff.get('normalized_runs_per_head_reduction_percent') or 0)>21.0,'Build 264 release-efficiency outcome missing')
q(eff.get('build255_closure_runs')==134 and eff.get('build262_closure_runs')==68,'Build 264 closure-run comparison missing')
q(eff.get('closure_scoped_runs')==584 and eff.get('closure_scoped_successes')==584 and eff.get('closure_scoped_failures')==0,'Build 264 closure-scoped GREEN sample missing')
q(eff.get('post_closure_noncanonical_browser_failures')==10 and eff.get('further_broad_trigger_rewrite')=='NOT_JUSTIFIED','Build 264 noncanonical residual decision missing')
q(rb.get('baseline_today_tasks_statements')==13 and rb.get('current_today_tasks_statements')==8,'Build 264 read fan-out outcome missing')
q(rb.get('current_aggregate_rows_read')==2179 and rb.get('aggregate_ceiling')==25000 and rb.get('production_d1_contact') is False,'Build 264 provider-budget result missing')
q(ce.get('build269_private_raw_media_intake') is True and ce.get('build271_standalone_social_workflow') is True and ce.get('build272_upload_prerequisite_rule') is True and ce.get('build273_content_studio_project_bridge') is True and ce.get('build274_creative_process_inventory_lifecycle') is True,'Build 264 CAIP repository evidence missing')

d=a.get('decision') or {}
q(d.get('autonomous_queue_exhausted') is False and d.get('action')=='CREATE_EVIDENCE_DRIVEN_SUCCESSOR_ROADMAP','Build 264 renewal decision mismatch')
q(d.get('next_build')==265 and d.get('next_build_title')=='CAIP Private-Media Prerequisite Inventory','Build 265 successor decision missing')
q('Build 264 — Refinement Outcomes Renewal III' in oldroad,'Build 264 authorization missing from predecessor roadmap')
for n in range(265,276):q(f'Build {n} —' in road,f'Successor roadmap missing Build {n}')
for token in ('21.69%','49.25%','584/584 GREEN','13 → 8 statements','2,179','Builds 265–268 recovery hardening','Build 265'):
    q(token in doc,f'Build 264 renewal document missing {token}')
q('Build 269 (Build 241 foundation, Builds 265–268 recovery hardening)' in caip269,'Build 269 documented recovery dependency missing')
q('Build 271 operating rule' in caipreadme,'Build 271 standalone CAIP authority missing')
q('Build 272 upload-prerequisite rule' in caipguide,'Build 272 upload prerequisite authority missing')
q('Build 273 delivered' in delivery,'Build 273 delivered CAIP bridge evidence missing')
q('Build 274 authority note' in caipguide,'Build 274 Creative Process lifecycle authority note missing')
q("run_current_contract('scripts/release467_build264_gate.py','Release 467 Build 264')" in sysgate,'System Gate must invoke Build 264')

if int(p.get('build') or 0)==264:
    q(p.get('state')=='DEVELOPMENT_GREEN','Current authority must identify Build 264')
    q(int(p.get('next_build') or 0)==265 and p.get('next_build_title')=='CAIP Private-Media Prerequisite Inventory','Current authority must expose Build 265 successor')
    q(p.get('accepted_dev_sha')=='ea930cd5c52e0d4f1d55fd9645fc24f5865900f2' and p.get('accepted_dev_tree_sha')=='e536e198fdb5f44b4430ae2d503e15731f2c9109','Build 264 must start from exact Build 263 Development')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='7ee1ac700f451d35a20ff3d667c405086c5512ef','Build 264 Production baseline must be Build 263')
    q(p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_RECOVERY_CONTINUITY_AUTONOMOUS_BUILDS_265_275.md','Current authority successor roadmap mismatch')
for k,v in (a.get('safety') or {}).items():q(v is False,f'Build 264 safety drift: {k}')

print('RELEASE 467 BUILD 264 REFINEMENT OUTCOMES RENEWAL III')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Builds 257-263: Production GREEN / exact-tree continuity retained')
print('Release efficiency: 21.69% normalized runs/head reduction; Build255->262 closure runs 134->68')
print('Today Tasks read fan-out: 13->8 statements; aggregate Development provider rows 2179/25000')
print('Decision: successor CAIP recovery/continuity roadmap authorized; queue remains OPEN')
print('Next: Build 265 — CAIP Private-Media Prerequisite Inventory')
