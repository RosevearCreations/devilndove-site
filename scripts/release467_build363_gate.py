#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build363-grey-hair-source-review-story-plan-completion-continuity-vii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='44bd708887357fc7b3341afdae3e990bb3524719' and pred.get('development_tree_sha')=='c8ab10efe9bcd310e74d3b5debefb32bf0f77296','Build 362 Development predecessor mismatch')
q(pred.get('production_main_sha')=='314ceb7e38d946cc9cef8d0e03fc43d2be3d7b81' and pred.get('production_tree_sha')=='c8ab10efe9bcd310e74d3b5debefb32bf0f77296','Build 362 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build363_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 363 regression failed')
q("run_current_contract('scripts/release467_build363_gate.py','Release 467 Build 363')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 363')
cur=int(p.get('build') or 0);q(cur>=363,'Current pointer must retain Build 363 or successor')
if cur==363:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==364,'Build 363 current authority/successor mismatch')
print('RELEASE 467 BUILD 363 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY VII')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 364 — Search Console Real Export & Fresh Discovery Intake IX')
