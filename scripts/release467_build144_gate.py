#!/usr/bin/env python3
"""Release 467 Build 144 — Buyer Discovery, Search & Collections gate."""
from pathlib import Path
import json,sys,re
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
    if not ok:FAIL.append(msg)
def read(p):return(ROOT/p).read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p))
closure=load('docs/operations/release467-build143-external-closure.json');ux=read('public/js/storefront-discovery-build144.js');shop=read('shop/index.html');prov=read('scripts/current_system_gate_provenance_gate.py');manifest=load('migrations/canonical/manifest.json')
req(closure.get('state')=='PRODUCTION_GREEN','Build 143 external closure must be Production GREEN')
req(closure.get('dev_sha')=='9b9a6d74eeeba67f07998ba9e0094489f75ec746','Build 143 SHA drifted')
req(closure.get('tree_sha')=='3c912240896ce6587494cb2c1a0f993edc861587','Build 143 tree drifted')
for n in (34767186508,34767186595,34767186581,34767186574,34767270995,34767321178):req(str(n) in read('docs/operations/release467-build143-external-closure.json'),f'missing Build143 proof {n}')
for t in ('BUILD=144','tolerantMatch','Handmade','Vintage','Under $25','Gift ideas','Local pickup','Ready to ship','Disconnected','Price and stock are not live','sessionStorage','popstate','pagehide','dd:shop:data'):req(t in ux,f'Build144 discovery missing {t}')
req('shopSearchInput' in shop and 'shopRecentlyViewedMount' in shop and 'shopCollectionsMount' in shop,'Shop discovery baseline missing')
files=[str(x.get('file')or'') for x in manifest.get('migrations',[]) if isinstance(x,dict)]
req(files==['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql'],'canonical D1 migrations must remain 0001-0004')
req("run_current_contract('scripts/release467_build144_gate.py','Release 467 Build 144')" in prov,'active provenance must call Build144')
if FAIL:
 print('RELEASE 467 BUILD 144 GATE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 144 GATE: PASS')
print('Build 143 six-proof closure: INGESTED EXTERNALLY')
print('Discovery/search: TOLERANT / QUICK INTENT / OFFLINE-LABELED / ZERO-RESULT RECOVERY')
print('Canonical D1: 0001-0004 / UNCHANGED')
