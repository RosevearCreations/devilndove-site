#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
DEV='c437998c7b17cf7bce4d6ae913d2273e3f96e038';TREE='95df4beae5394ebf85c9b2bc1665525ab6ed5eb5';MAIN='9689e81f23722d58421df87b2ea6b41ca39005fb'
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build300-caip-maker-content-outcomes-renewal-automation-refinement.json')
p=j('current-development-authority.json')
prev=j('release467-build299-d1-query-efficiency-canonical-runtime-repository-cleanup.json')
q(a.get('release')==467 and a.get('build')==300 and a.get('title')=='CAIP Maker Content Outcomes Renewal & Automation Refinement','Build 300 identity mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')==DEV and pred.get('development_tree_sha')==TREE,'Build 299 Development predecessor mismatch')
q((pred.get('development_proofs') or {}).get('system_gate_run')==36627208895 and (pred.get('development_proofs') or {}).get('build_specific_proof_run')==36627208914,'Build 299 Development proof ingestion mismatch')
q(pred.get('production_main_sha')==MAIN and pred.get('production_tree_sha')==TREE,'Build 299 Production predecessor mismatch')
q(pred.get('production_pages_deploy_run')==36627976523 and pred.get('production_live_resource_integrity_run')==36628136953,'Build 299 Production proof ingestion mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 299 authority must be ingested as Production GREEN')
q((prev.get('final_closure') or {}).get('ingested_by_build')==300,'Build 299 Development closure ingestion mismatch')
q((prev.get('production_checkpoint') or {}).get('ingested_by_build')==300,'Build 299 Production closure ingestion mismatch')
scope=a.get('scope') or {}
q(scope.get('duplicate_identity_measurement') is True and scope.get('private_media_boundary_measurement') is True,'Build 300 CAIP evidence scope incomplete')
q(scope.get('content_studio_idempotency_measurement') is True and scope.get('human_approval_boundary_measurement') is True,'Build 300 review/identity measurement scope incomplete')
q(scope.get('automation_refinement')=='EVIDENCE_GATED_REVIEW_FIRST','Build 300 automation boundary mismatch')
s=a.get('safety') or {}
q(s.get('schema_change') is False and s.get('production_d1_measurement_contact') is False and s.get('automatic_public_release') is False,'Build 300 safety boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build300_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 300 regression failed')
q("run_current_contract('scripts/release467_build300_gate.py','Release 467 Build 300')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 300')
q(int(p.get('build') or 0)>=300,'Current authority must retain Build 300 or successor')
if int(p.get('build') or 0)==300:
    q(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE,'Build 300 starting checkpoint mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')==MAIN,'Build 300 Production predecessor pointer mismatch')
    q(int(p.get('next_build') or 0)==301 and p.get('next_build_title')=='First Real Maker Story Adoption & Completeness','Build 301 successor pointer mismatch')
    q(p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_CONTENT_ADOPTION_BUILDS_301_306.md','Build 300 successor roadmap pointer mismatch')
print('RELEASE 467 BUILD 300 CAIP MAKER CONTENT OUTCOMES RENEWAL & AUTOMATION REFINEMENT')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Measured decision: ADOPTION_GUIDANCE_ONLY_NO_NEW_AUTOMATION')
print('Next: Build 301 — First Real Maker Story Adoption & Completeness')
