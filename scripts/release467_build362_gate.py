#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build362-35th-promo-factual-evidence-completion-continuity-vii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='3ff87de9bf8a91f1764778498ad4c7b2d28d1c57' and pred.get('development_tree_sha')=='ff5988551b77c67ea72ebefd2d8d2b99aa014d82','Build 361 Development predecessor mismatch')
q(pred.get('production_main_sha')=='ac4f29f4cbeca4036b9f6ae57d7e0a563d6d8696' and pred.get('production_tree_sha')=='ff5988551b77c67ea72ebefd2d8d2b99aa014d82','Build 361 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build362_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 362 regression failed')
q("run_current_contract('scripts/release467_build362_gate.py','Release 467 Build 362')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 362')
cur=int(p.get('build') or 0);q(cur>=362,'Current pointer must retain Build 362 or successor')
if cur==362:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==363,'Build 362 current authority/successor mismatch')
print('RELEASE 467 BUILD 362 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY VII')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 363 — Grey Hair Source Review & Story-Plan Completion Continuity VII')
