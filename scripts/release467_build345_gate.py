#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build345-grey-hair-source-review-story-plan-completion-continuity-iv.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='48fb55182bcd6b0a4208e0cc36e2253fd73b92e6' and pred.get('development_tree_sha')=='541504c45ad45c8bd529ae42ee25abcc64980d67','Build 344 Development predecessor mismatch')
q(pred.get('production_main_sha')=='e797092067a1ba6c5d3d27f23db48e990e89edaf' and pred.get('production_tree_sha')=='541504c45ad45c8bd529ae42ee25abcc64980d67','Build 344 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build345_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 345 regression failed')
q("run_current_contract('scripts/release467_build345_gate.py','Release 467 Build 345')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 345')
cur=int(p.get('build') or 0);q(cur>=345,'Current pointer must retain Build 345 or successor')
if cur==345:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==346,'Build 345 current authority/successor mismatch')
print('RELEASE 467 BUILD 345 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY IV')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 346 — Search Console Real Export & Fresh Discovery Intake VI')
