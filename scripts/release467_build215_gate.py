#!/usr/bin/env python3
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='825814b09a7c3f05c6fddc223ec8876ade0bbc35';TREE='f1facb7a27e22f3a129654713cc6dd109e3b6b16';MAIN='c8366bde7fb2e7c673be656ff85265058a407c4a'
PROOFS={'system_gate_run':35548513112,'current_application_quality_run':35548513093,'it_admin_runtime_proof_run':35548513139,'branch_hygiene_run':35548513160}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append(f'missing {p}');return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build215-small-batch-corporate-event-quoting.json');m=load('migrations/canonical/manifest.json')
req(int(p.get('build') or 0)>=215,'current pointer regressed before Build 215')
req('release467-build215-small-batch-corporate-event-quoting.json' in (p.get('current_release_authorities') or []),'successor pointer lost Build 215 authority')
req(b.get('build')==215 and b.get('state')=='PRODUCTION_GREEN','Build 215 retained authority must be Production GREEN')
final=b.get('final_closure') or {};req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS and int(final.get('build_specific_proof_run') or 0)==35548513080,'Build 215 exact Development closure drifted')
prod=b.get('production_checkpoint') or {};req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35548670491 and int(prod.get('production_live_resource_integrity_run') or 0)==35548742503 and int(prod.get('products_browser_proof_run') or 0)==35548742488 and int(prod.get('products_route_proof_run') or 0)==35548742478 and int(prod.get('build_specific_proof_run') or 0)==35548670519,'Build 215 Production closure drifted')
req(prod.get('exact_production_url')=='https://cec5e207.devilndove-site.pages.dev','Build 215 Production URL drifted')
req(prod.get('deployment_id')=='cec5e207-de9d-40f3-a9fe-3e6f25e67da6','Build 215 deployment identity drifted')
req(int(prod.get('canonical_migrations') or 0)==15 and int(prod.get('foreign_key_violations') or 0)==0,'Build 215 migration/FK closure drifted')
counts=prod.get('business_counts') or {};req(counts=={'users':2,'products':45,'site_item_inventory':1041,'orders':0} and prod.get('business_counts_preserved') is True,'Build 215 Production business-count preservation drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)];req('0015_release467_small_batch_corporate_event_quoting.sql' in files,'Build 215 migration missing from canonical stream')
if FAIL:print('RELEASE 467 BUILD 215 RETAINED SMALL-BATCH CORPORATE EVENT QUOTING CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 215 RETAINED SMALL-BATCH CORPORATE EVENT QUOTING CLOSURE: PASS')
print('Development:',DEV)
print('Production:',MAIN)
print('Shared tree:',TREE)
print('Production business counts: PRESERVED')
