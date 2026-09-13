#!/usr/bin/env python3
"""Release 467 Build 145 — Product Detail Trust, Story & Conversion gate."""
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
    if not ok:FAIL.append(msg)
def read(p):return(ROOT/p).read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p))
closure=load('docs/operations/release467-build144-external-closure.json');ux=read('public/js/product-detail-build145.js');page=read('shop/product/index.html');prov=read('scripts/current_system_gate_provenance_gate.py');manifest=load('migrations/canonical/manifest.json')
req(closure.get('state')=='PRODUCTION_GREEN','Build144 external closure must be GREEN')
req(closure.get('dev_sha')=='141f0892fbf55f04e67eb579540cb390031ddde1','Build144 SHA drifted')
req(closure.get('tree_sha')=='41c1e0c88ebfb7a75be7237dd55a7c2ee8e7b160','Build144 tree drifted')
for n in (34768495547,34768495629,34768495679,34768495564,34768600422,34768648404):req(str(n) in read('docs/operations/release467-build144-external-closure.json'),f'missing Build144 proof {n}')
for t in ('BUILD=145','BUYER CONFIDENCE','Origin & listing type','Availability','Materials / dimensions','Fulfilment','Care & confidence','Reconnect to confirm availability','server-authoritative','MutationObserver'):req(t in ux,f'Build145 product trust missing {t}')
req(ux.count('/api/')==0,'Build145 overlay must add no API authority')
req(page.lower().count('<h1')==1,'Product detail must retain exactly one H1')
files=[str(x.get('file')or'') for x in manifest.get('migrations',[]) if isinstance(x,dict)]
req(files==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'canonical D1 migrations must remain 0001-0004')
req("run_current_contract('scripts/release467_build145_gate.py','Release 467 Build 145')" in prov,'active provenance must call Build145')
if FAIL:
 print('RELEASE 467 BUILD 145 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 145 GATE: PASS')
print('Build144 six-proof closure: INGESTED EXTERNALLY')
print('Product detail: TRUST / STORY / OFFLINE PURCHASE GUARD / ONE-H1')
print('Canonical D1: 0001-0004 / UNCHANGED')
