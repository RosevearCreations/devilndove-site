#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build311-buyer-discovery-evidence-freshness-search-intake.json')
p=j('current-development-authority.json')
q(a.get('build')==311 and a.get('title')=='Buyer Discovery Evidence Freshness & Search Intake','Build 311 identity mismatch')
pred=a.get('predecessor') or {}
q(pred.get('state')=='PRODUCTION_GREEN' and pred.get('development_sha')=='c1a4778dd3aaf2a1fece8406e075da7eb2c2b74d' and pred.get('development_tree_sha')=='b4aa3deaa0eed32bc601ecf51d5456e5c5d85760','Build 310 Development predecessor mismatch')
q(pred.get('production_main_sha')=='43120a39d39aa0b0a2b0299967ad2e7b97eab0ee' and pred.get('production_tree_sha')=='b4aa3deaa0eed32bc601ecf51d5456e5c5d85760','Build 310 Production predecessor mismatch')
s=a.get('safety') or {};q(s.get('schema_change') is False and s.get('request_time_schema_mutation') is False and s.get('traffic_fabrication') is False and s.get('provider_execution') is False and s.get('production_d1_contact') is False,'Build 311 safety boundary mismatch')
r=subprocess.run([sys.executable,str(R/'scripts/release467_build311_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);print(r.stdout,end='');q(r.returncode==0,'Build 311 regression failed')
q("run_current_contract('scripts/release467_build311_gate.py','Release 467 Build 311')" in t('scripts/current_system_gate_provenance_gate.py'),'System Gate missing Build 311')
cur=int(p.get('build') or 0);q(cur>=311,'Current pointer must retain Build 311 or successor')
if cur==311:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==312,'Build 311 current authority/successor mismatch')
print('RELEASE 467 BUILD 311 BUYER DISCOVERY EVIDENCE FRESHNESS & SEARCH INTAKE')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Next: Build 312 — Content Adoption Coverage Outcomes Renewal II & Roadmap Renewal')
