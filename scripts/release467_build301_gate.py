#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
DEV='6361b02f467fa4b9bf54dd8638cccefc57bd817e';TREE='6316130ee40beb8540e88da51065f3a75d1c527a';MAIN='e569d5fce0ff5ab08a3d1dc6be1051211ed15ac2'
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build301-first-real-maker-story-adoption-completeness.json')
prev=j('release467-build300-caip-maker-content-outcomes-renewal-automation-refinement.json')
p=j('current-development-authority.json')
q(a.get('build')==301 and a.get('title')=='First Real Maker Story Adoption & Completeness','Build 301 identity mismatch')
q(a.get('phase')=='REAL_MAKER_STORY_ADOPTION_CANDIDATE','Build 301 adoption phase mismatch')
sel=a.get('selected_real_project') or {}
q(sel.get('creative_work_project_id')==7 and sel.get('project_key')=='CP-MSXCYQB6' and sel.get('project_title')=='Under the Sea','Build 301 selected real project mismatch')
ad=a.get('adoption_contract') or {}
q(ad.get('story_kind')=='maker_story' and ad.get('outcome_status')=='partial_win' and ad.get('story_review_status')=='needs_review' and ad.get('public_story_candidate')==0,'Build 301 review-first adoption contract mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')==DEV and pred.get('development_tree_sha')==TREE,'Build 300 Development predecessor mismatch')
q(pred.get('production_main_sha')==MAIN and pred.get('production_tree_sha')==TREE,'Build 300 Production predecessor mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 300 must be ingested Production GREEN')
q((prev.get('final_closure') or {}).get('ingested_by_build')==301,'Build 300 Development closure ingestion mismatch')
q((prev.get('production_checkpoint') or {}).get('ingested_by_build')==301,'Build 300 Production closure ingestion mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build301_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 301 regression failed')
q("run_current_contract('scripts/release467_build301_gate.py','Release 467 Build 301')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 301')
q(int(p.get('build') or 0)>=301,'Current pointer must retain Build 301 or successor')
if int(p.get('build') or 0)==301:
    q(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE,'Build 301 starting checkpoint mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')==MAIN,'Build 301 Production predecessor mismatch')
    q(int(p.get('next_build') or 0)==302 and p.get('next_build_title')=='CAIP Evidence Selection & Public-Safety Review Adoption','Build 302 successor mismatch')
print('RELEASE 467 BUILD 301 FIRST REAL MAKER STORY ADOPTION & COMPLETENESS')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 302 — CAIP Evidence Selection & Public-Safety Review Adoption')
