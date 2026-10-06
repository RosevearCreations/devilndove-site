#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build360-content-adoption-discovery-outcomes-renewal-x.json')
p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='b54800530aad16cf4056506e817aefd7d603d018' and pred.get('development_tree_sha')=='ae7f5495c3830b9a168184fe596e361538ab31a8','Build 359 Development predecessor mismatch')
q(pred.get('production_main_sha')=='8c3461e494398f41e6053616f1cd57a0a2935c65' and pred.get('production_tree_sha')=='ae7f5495c3830b9a168184fe596e361538ab31a8','Build 359 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build360_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 360 regression failed')
q("run_current_contract('scripts/release467_build360_gate.py','Release 467 Build 360')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 360')
cur=int(p.get('build') or 0);q(cur>=360,'Current pointer must retain Build 360 or successor')
if cur==360:q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN') and int(p.get('next_build') or 0)==361,'Build 360 current authority/successor mismatch')
print('RELEASE 467 BUILD 360 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL X')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next roadmap: observed-evidence renewal after exact Development measurement.')
