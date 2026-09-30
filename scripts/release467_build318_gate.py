#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build318-content-adoption-discovery-outcomes-renewal-iii.json');p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='66c944cfcff4c60ad90ff0df00d7bbbd67a1c1f5' and pred.get('development_tree_sha')=='b721482133a03fd851f36078320527784e247247','Build 317 Development predecessor mismatch')
q(pred.get('production_main_sha')=='9d2ccc468ea810fdd6cf0e6f2527d50c6418876e' and pred.get('production_tree_sha')=='b721482133a03fd851f36078320527784e247247','Build 317 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build318_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 318 regression failed')
q("run_current_contract('scripts/release467_build318_gate.py','Release 467 Build 318')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 318')
q(int(p.get('build') or 0)>=318,'Current pointer must retain Build 318 or successor')
print('RELEASE 467 BUILD 318 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL III')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
