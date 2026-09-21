#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='20afcad9a74589cd015c94a1172dc10e3e8b55a5';TREE='188dc8f60480c902ac91a6f957b30c37a7166c7d';MAIN='d67fe22bb0cceaf8d6ea133f688a9304c7d1f439'
PROOFS={'system_gate_run':35643013344,'current_application_quality_run':35643013215,'it_admin_runtime_proof_run':35643013107,'branch_hygiene_run':35643013180}
def req(ok,msg):
 if not ok: FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file(): FAIL.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p): return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build224-manufacturing-era-closure-next-roadmap.json');m=load('migrations/canonical/manifest.json')
sql=read('scripts/release467_build224_measurement.sql');nextroad=read('docs/operations/RELEASE_467_POST_MANUFACTURING_AUTONOMOUS_BUILDS_225_232.md')
req(int(p.get('build') or 0)>=224,'current successor regressed before Build 224')
req(b.get('build')==224 and b.get('state')=='PRODUCTION_GREEN','Build 224 retained authority must be Production GREEN')
final=b.get('final_closure') or {};prod=b.get('production_checkpoint') or {}
req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS,'Build 224 exact Development closure drifted')
req(int(final.get('build_specific_proof_run') or 0)==35643013307 and final.get('exact_dev_push_workflows')=='34/34','Build 224 exact Development proof set drifted')
req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and prod.get('state')=='PRODUCTION_GREEN','Build 224 exact Production SHA/tree drifted')
req(int(prod.get('production_pages_deploy_run') or 0)==35643398483 and int(prod.get('production_live_resource_integrity_run') or 0)==35643492350,'Build 224 Production Pages/live-resource closure drifted')
req(int(prod.get('products_browser_proof_run') or 0)==35643492529 and int(prod.get('products_route_proof_run') or 0)==35643492514 and int(prod.get('build_specific_proof_run') or 0)==35643398886,'Build 224 Production proof set drifted')
req(prod.get('exact_main_sha_workflows')=='33/33' and int(prod.get('canonical_migrations') or 0)==21 and int(prod.get('remote_d1_queries') or 0)==0 and prod.get('code_only') is True,'Build 224 Production workflow/schema boundary drifted')
req(prod.get('exact_production_url')=='https://6041effd.devilndove-site.pages.dev' and prod.get('deployment_id')=='6041effd-6004-4768-bd36-e5dd8cfe0506' and int(prod.get('production_promotion_artifact_id') or 0)==10659270575,'Build 224 Production deployment proof drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)>=21 and files[20]=='0021_release467_project_knowledge_recipe_history.sql','Build 224 retained closure must keep canonical migrations at 21')
measurement=b.get('measurement') or {}
req(measurement.get('state')=='EXACT_DEVELOPMENT_MEASURED_GREEN' and int(measurement.get('d1_provider_rows_read') or 0)==8781 and int(measurement.get('d1_rows_read_ceiling') or 0)==25000,'Build 224 measured closure drifted')
launch=measurement.get('launch_set_current') or {}
req(launch=={'products_reviewed':43,'ready_products':1,'review_required_products':42,'externally_blocked_products':0,'publicly_visible_products':40,'media_ready_products':3,'tracked_zero_stock_products':2,'products_with_linked_resources':2,'products_with_missing_linked_inventory':0,'products_with_unknown_linked_cost':2,'buyer_blocked_products':16},'Build 224 launch-set measurement drifted')
req(not re.search(r'(?im)^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE|PRAGMA)\b',sql),'Build 224 measurement query contains mutation or DDL')
successor=b.get('successor_roadmap') or {}
req(successor.get('state')=='AUTHORIZED_FROM_BUILD224_PRODUCTION_GREEN' and successor.get('future_queue_exhausted') is False,'Build 224 successor authorization drifted')
req([int(x.get('build') or 0) for x in successor.get('builds',[])]==list(range(225,233)),'Build 224 successor build sequence must remain 225-232')
for n in range(225,233): req(f'Build {n}' in nextroad,f'Post-manufacturing roadmap missing Build {n}')
if FAIL:
 print('RELEASE 467 BUILD 224 RETAINED MANUFACTURING ERA CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 224 RETAINED MANUFACTURING ERA CLOSURE: PASS')
print('Build 224 Development: EXACT GREEN / 34 of 34')
print('Build 224 Production: EXACT GREEN / 33 of 33')
print('Canonical migration: NONE / remains 0001-0021')
print('Build 225 successor: AUTHORIZED')
