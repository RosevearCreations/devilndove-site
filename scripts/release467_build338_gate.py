#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build338-35th-promo-factual-evidence-completion-continuity-iii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='8f5d038fa7c7d5b3213f6d64f51d659c3ce74994' and pred.get('development_tree_sha')=='3d173e98cfdf48b2efafdfb55a326c275e9cd041','Build 337 Development predecessor mismatch')
q(pred.get('production_main_sha')=='cf588329be80a4cf463d0632845521f4e3685991' and pred.get('production_tree_sha')=='3d173e98cfdf48b2efafdfb55a326c275e9cd041','Build 337 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build338_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 338 regression failed')
q("run_current_contract('scripts/release467_build338_gate.py','Release 467 Build 338')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 338')
cur=int(p.get('build') or 0);q(cur>=338,'Current pointer must retain Build 338 or successor')
if cur==338:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==339,'Build 338 current authority/successor mismatch')
print('RELEASE 467 BUILD 338 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY III')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 339 — Grey Hair Source Review & Story-Plan Completion Continuity III')
