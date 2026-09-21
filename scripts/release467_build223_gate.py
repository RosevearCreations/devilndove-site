#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
DEV='a9fd2f4e10f8bf68d3fe9b40c82ced112cf91bb1';TREE='255d08bc787f7eb785119ceaffa61d6aa5eeefed';MAIN='e55cff067fda9a1c949e93db8ea2ea3e5f8d366f'
PROOFS={'system_gate_run':35624331277,'current_application_quality_run':35624331446,'it_admin_runtime_proof_run':35624331471,'branch_hygiene_run':35624331702}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):
 f=ROOT/p
 if not f.is_file():FAIL.append('missing '+p);return''
 return f.read_text(encoding='utf-8',errors='replace')
def load(p):return json.loads(read(p) or '{}')
p=load('current-development-authority.json');b=load('release467-build223-capability-case-studies-workshop-journal-search-richness.json');b222=load('release467-build222-project-knowledge-recipe-history.json');m=load('migrations/canonical/manifest.json')
api=read('functions/api/capability-case-studies.js');client=read('public/js/capability-case-studies.js');hub=read('case-studies/index.html');journal=read('workshop-journal/index.html');journaljs=read('public/js/workshop-journal-publications.js');cap=read('capabilities/index.html');capjs=read('public/js/capabilities.js');site=read('js/main.js');sitemap=read('sitemap.xml')
req(p.get('build')==223 and p.get('title')=='Capability Case Studies, Workshop Journal & Search Richness','Build 223 pointer identity drifted')
req(p.get('accepted_dev_sha')==DEV and p.get('accepted_dev_tree_sha')==TREE and (p.get('acceptance') or {})==PROOFS,'Build 223 predecessor Development proof drifted')
prod=p.get('production_checkpoint') or {}
req(prod.get('build')==222 and prod.get('main_sha')==MAIN and prod.get('tree_sha')==TREE and int(prod.get('production_pages_deploy_run') or 0)==35624807963 and int(prod.get('production_live_resource_integrity_run') or 0)==35624977882,'Build 222 Production predecessor drifted')
req(b.get('build')==223 and b.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 223 authority drifted')
req(b222.get('state')=='PRODUCTION_GREEN','Build 222 retained authority must be Production GREEN')
files=[x.get('file') for x in m.get('migrations',[]) if isinstance(x,dict)]
req(len(files)==21 and files[-1]=='0021_release467_project_knowledge_recipe_history.sql','Build 223 must not add a canonical migration')
for token in ('publicContentPublications','content_publications','workshop_capability_profiles','creative_project_operations','inventory_processes','creative_project_manufacturing_lifecycles','creative_project_production_runs','raw_private_caip_exposed:false','automatic_publication:false','private_media_queries:false'):req(token in api,'Build 223 API missing '+token)
for forbidden in ('INSERT INTO','UPDATE ','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','creative_assets','bucket.put(','bucket.delete(','publishContentPublication','prepareContentPublications'):req(forbidden not in api,'Build 223 API crosses read-only/public boundary: '+forbidden)
req(len(re.findall(r'<h1(?:\s|>)',hub,re.I))==1,'Case Studies hub must contain exactly one H1')
for token in ('approved public evidence only','/custom-request/','/capabilities/','/workshop-journal/','data-capability-case-studies'):req(token in hub,'Case Studies hub missing '+token)
req('/case-studies/' in journal and '/case-studies/' in cap and '/case-studies/' in capjs and '/case-studies/' in site,'Build 223 internal linking is incomplete')
req('/api/capability-case-studies?limit=6' in journaljs,'Workshop Journal must consume Build 223 published-case-study projection')
req('https://devilndove.com/case-studies/' in sitemap,'Case Studies hub missing from sitemap')
req('/workshop-journal/story/' not in '\n'.join([line for line in sitemap.splitlines() if '<loc>' in line and '?story=' in line]),'dynamic query-selected story must not enter sitemap')
for path in ('functions/api/capability-case-studies.js','public/js/capability-case-studies.js','public/js/workshop-journal-publications.js','public/js/capabilities.js','functions/api/admin/it-operations-control-tower.js'):
 q=subprocess.run(['node','--check',str(ROOT/path)],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);req(q.returncode==0,path+' syntax failed: '+(q.stderr or q.stdout)[-1200:])
if FAIL:
 print('RELEASE 467 BUILD 223 CAPABILITY CASE STUDIES WORKSHOP JOURNAL SEARCH RICHNESS: FAIL');[print('-',x) for x in FAIL];sys.exit(1)
print('RELEASE 467 BUILD 223 CAPABILITY CASE STUDIES WORKSHOP JOURNAL SEARCH RICHNESS: PASS')
print('Canonical migration: NONE / remains 0001-0021')
print('Public source: ALREADY-PUBLISHED CONTENT RELEASE RECORDS ONLY')
print('Raw/private CAIP exposure / automatic publication / source mutation: ZERO')
