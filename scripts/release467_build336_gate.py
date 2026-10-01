#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build336-content-adoption-discovery-outcomes-renewal-vi.json')
p=j('current-development-authority.json')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='bec1c4bf76cf69e6b42dc3768b1de22400e0b052' and pred.get('development_tree_sha')=='d8b3b0139055920106b78ee17b1a65b3cc19f3b4','Build 335 Development predecessor mismatch')
q(pred.get('production_main_sha')=='8bda25fe29647f23a4a3b4bcb3f0ded515ae2d87' and pred.get('production_tree_sha')=='d8b3b0139055920106b78ee17b1a65b3cc19f3b4','Build 335 Production predecessor mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build336_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(r.stdout,end='');q(r.returncode==0,'Build 336 regression failed')
q("run_current_contract('scripts/release467_build336_gate.py','Release 467 Build 336')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 336')
cur=int(p.get('build') or 0);q(cur>=336,'Current pointer must retain Build 336 or successor')
print('RELEASE 467 BUILD 336 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL VI')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
