#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='f69deaa659520af182edc60dfc7cfefc7914d8f8'
TREE='23394309d09e765c5327fbf8715532faabc78d6a'
MAIN='704c407485c0fd0c3de785b696113d3cc7be5a27'
PROOFS={'system_gate_run':35636209245,'current_application_quality_run':35636209377,'it_admin_runtime_proof_run':35636209182,'branch_hygiene_run':35636209309}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json')
b=load('release467-build223-capability-case-studies-workshop-journal-search-richness.json')
m=load('migrations/canonical/manifest.json')
api=read('functions/api/capability-case-studies.js');client=read('public/js/capability-case-studies.js')
hub=read('case-studies/index.html');journal=read('workshop-journal/index.html')
journaljs=read('public/js/workshop-journal-publications.js');cap=read('capabilities/index.html')
capjs=read('public/js/capabilities.js');site=read('js/main.js');sitemap=read('sitemap.xml')
req(int(p.get('build') or 0)>=223,'current successor must retain Build 223 or later')
req(b.get('state')=='PRODUCTION_GREEN','Build 223 retained authority must be Production GREEN')
final=b.get('final_closure') or {};prod=b.get('production_checkpoint') or {}
req(final.get('dev_sha')==DEV and final.get('tree_sha')==TREE and (final.get('proofs') or {})==PROOFS,'Build 223 exact Development closure drifted')
req(int(final.get('build_specific_proof_run') or 0)==35636209003,'Build 223 exact Development build proof drifted')
req(final.get('exact_dev_push_workflows')=='39/39' and int(final.get('canonical_migrations') or 0)==21,'Build 223 Development workflow/schema closure drifted')
req(prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and prod.get('state')=='PRODUCTION_GREEN','Build 223 exact Production SHA/tree drifted')
req(int(prod.get('production_pages_deploy_run') or 0)==35636523017 and int(prod.get('production_live_resource_integrity_run') or 0)==35636619207,'Build 223 Production Pages/live-resource closure drifted')
req(int(prod.get('products_browser_proof_run') or 0)==35636619026 and int(prod.get('products_route_proof_run') or 0)==35636619136 and int(prod.get('build_specific_proof_run') or 0)==35636522959,'Build 223 Production proof set drifted')
req(prod.get('exact_main_sha_workflows')=='33/33' and int(prod.get('canonical_migrations') or 0)==21 and int(prod.get('remote_d1_queries') or 0)==0 and prod.get('code_only') is True,'Build 223 Production workflow/schema boundary drifted')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)>=21 and files[20]=='0021_release467_project_knowledge_recipe_history.sql','retained canonical stream lost migration 0021')
for token in ('publicContentPublications','content_publications','workshop_capability_profiles','creative_project_operations','inventory_processes','creative_project_manufacturing_lifecycles','creative_project_production_runs','raw_private_caip_exposed:false','automatic_publication:false','private_media_queries:false'):
 req(token in api,'Build 223 API missing '+token)
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','creative_assets','bucket.put(','bucket.delete(','publishContentPublication','prepareContentPublications'):
 req(forbidden not in api,'Build 223 API crosses read-only/public boundary: '+forbidden)
req(len(re.findall(r'<h1(?:\s|>)',hub,re.I))==1,'Case Studies hub must contain exactly one H1')
for token in ('approved public evidence only','/custom-request/','/capabilities/','/workshop-journal/','data-capability-case-studies'):
 req(token in hub,'Case Studies hub missing '+token)
req('/case-studies/' in journal and '/case-studies/' in cap and '/case-studies/' in capjs and '/case-studies/' in site,'Build 223 internal linking is incomplete')
req('/api/capability-case-studies?limit=6' in journaljs,'Workshop Journal must consume Build 223 published-case-study projection')
req('https://devilndove.com/case-studies/' in sitemap,'Case Studies hub missing from sitemap')
for path in ('functions/api/capability-case-studies.js','public/js/capability-case-studies.js','public/js/workshop-journal-publications.js','public/js/capabilities.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 req(q.returncode==0,path+' syntax failed: '+(q.stderr or q.stdout)[-1200:])
if FAIL:
 print('RELEASE 467 BUILD 223 RETAINED PRODUCTION CLOSURE: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 223 RETAINED PRODUCTION CLOSURE: PASS')
print('Build 223 Development: EXACT GREEN / 39 of 39')
print('Build 223 Production: EXACT GREEN / 33 of 33')
print('Canonical migration: NONE / remains 0001-0021')
print('Build 223 authority: RETAINED BY BUILD 224')
