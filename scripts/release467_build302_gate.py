#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
DEV='e180724a52210fdf56c4d53b5221be2f121c36de';TREE='d11b3492ef6d389270d9acc58d94e4740591bb38';MAIN='3eec733afd9b8c585efaab1c8a89fa244d9f65d8'
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build302-caip-evidence-selection-public-safety-review-adoption.json')
prev=j('release467-build301-first-real-maker-story-adoption-completeness.json')
p=j('current-development-authority.json')
q(a.get('build')==302 and a.get('title')=='CAIP Evidence Selection & Public-Safety Review Adoption','Build 302 identity mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')==DEV and pred.get('development_tree_sha')==TREE,'Build 301 Development predecessor mismatch')
q(pred.get('production_main_sha')==MAIN and pred.get('production_tree_sha')==TREE,'Build 301 Production predecessor mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 301 must be ingested Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')==DEV and (prev.get('final_closure') or {}).get('tree_sha')==TREE,'Build 301 Development closure mismatch')
q((prev.get('final_closure') or {}).get('ingested_by_build')==302,'Build 301 closure ingestion mismatch')
q((prev.get('production_checkpoint') or {}).get('main_sha')==MAIN and (prev.get('production_checkpoint') or {}).get('ingested_by_build')==302,'Build 301 Production ingestion mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build302_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 302 regression failed')
q("run_current_contract('scripts/release467_build302_gate.py','Release 467 Build 302')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 302')
q(int(p.get('build') or 0)>=302,'Current pointer must retain Build 302 or successor')
if int(p.get('build') or 0)==302:
    q(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE,'Build 302 starting checkpoint mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')==MAIN,'Build 302 Production predecessor mismatch')
    q(int(p.get('next_build') or 0)==303 and p.get('next_build_title')=='Content Studio Draft Review & Approval Adoption','Build 303 successor mismatch')
print('RELEASE 467 BUILD 302 CAIP EVIDENCE SELECTION & PUBLIC-SAFETY REVIEW ADOPTION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 303 — Content Studio Draft Review & Approval Adoption')
