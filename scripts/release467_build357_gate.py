#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build357-grey-hair-source-review-story-plan-completion-continuity-vi.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='e6b1c66ec636997623b90770ef86eaedc1bfc5ed' and pred.get('development_tree_sha')=='30ed420bc2ad1dbbb24ff2457496db23060f30d3','Build 350 Development predecessor mismatch')
q(pred.get('production_main_sha')=='b33ced533a4fd86e418516ca7b270387ed8bc7ce' and pred.get('production_tree_sha')=='30ed420bc2ad1dbbb24ff2457496db23060f30d3','Build 350 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build357_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 357 regression failed')
q("run_current_contract('scripts/release467_build357_gate.py','Release 467 Build 357')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 357')
cur=int(p.get('build') or 0);q(cur>=351,'Current pointer must retain Build 357 or successor')
if cur==351:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==352,'Build 357 current authority/successor mismatch')
print('RELEASE 467 BUILD 357 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY V')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 358 — Search Console Real Export & Fresh Discovery Intake VIII')
