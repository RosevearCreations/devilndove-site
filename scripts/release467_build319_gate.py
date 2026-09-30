#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build319-35th-promo-execution-evidence-intake-completeness.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='90e3c5c14643dfef21b8d4435c81e92606eb75d4' and pred.get('development_tree_sha')=='0c1546c92eebdbdc6039a15c7fd7a7fd63055c3e','Build 318 Development predecessor mismatch')
q(pred.get('production_main_sha')=='e51706c73352af58cac0640a12e915c5b4b2796d' and pred.get('production_tree_sha')=='0c1546c92eebdbdc6039a15c7fd7a7fd63055c3e','Build 318 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build319_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 319 regression failed')
q("run_current_contract('scripts/release467_build319_gate.py','Release 467 Build 319')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 319')
cur=int(p.get('build') or 0);q(cur>=319,'Current pointer must retain Build 319 or successor')
if cur==319:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==320,'Build 319 current authority/successor mismatch')
print('RELEASE 467 BUILD 319 35TH PROMO EXECUTION EVIDENCE INTAKE & COMPLETENESS')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 320 — Grey Hair Source-Evidence Review & Story-Plan Readiness')
