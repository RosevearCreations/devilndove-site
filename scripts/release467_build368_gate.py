#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build368-35th-promo-factual-evidence-completion-continuity-viii.json');p=j('current-development-authority.json');pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='531fe6d5d4599ecb79b747e6690191faa3134713' and pred.get('development_tree_sha')=='c0dfeed5f2b2713bf747e592796aa6dbd28b6e02','Build 367 Development predecessor mismatch')
q(pred.get('production_main_sha')=='bbdb69303d24005f38eb395273490c9c05fa1bdb' and pred.get('production_tree_sha')=='c0dfeed5f2b2713bf747e592796aa6dbd28b6e02','Build 367 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build368_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 368 regression failed')
cur=int(p.get('build') or 0)
if cur>=368:q("run_current_contract('scripts/release467_build368_gate.py','Release 467 Build 368')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 368')
print('RELEASE 467 BUILD 368 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY VIII')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
