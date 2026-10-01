#!/usr/bin/env python3
from pathlib import Path
import json,subprocess,sys,re
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build294-caip-workshop-follies-maker-story-foundation.json')
p=j('current-development-authority.json')
manifest=j('migrations/canonical/manifest.json')
mig=t('migrations/canonical/0027_release467_caip_workshop_follies_maker_story_foundation.sql')
api=t('functions/api/admin/creative-process-compat.js')
ui=t('public/js/admin-creative-process.js')
page=t('admin/creative-process/index.html')
caip_root=t('_lib/creativeAssetIntelligence.js')
caip_api=t('functions/api/_lib/creativeAssetIntelligence.js')
content=t('functions/api/_lib/contentAutomationStudio.js')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('release')==467 and a.get('build')==294 and a.get('title')=='CAIP Workshop Follies & Maker Story Foundation','Build 294 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 294 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='f8645db239348f06098faa1915ef9376940746de','Build 293 Development predecessor mismatch')
q(pred.get('production_main_sha')=='229f9299561a820c029d1eec69e8f088b94c9a09','Build 293 Production predecessor mismatch')
q(pred.get('development_tree_sha')=='e74e6358bef93ee6d16802b488363145c4d66c04' and pred.get('production_tree_sha')=='e74e6358bef93ee6d16802b488363145c4d66c04' and pred.get('same_tree') is True,'Build 293 exact-tree predecessor mismatch')

files=[x.get('file') for x in manifest.get('migrations',[]) if isinstance(x,dict)]
q(len(files)>=27 and files[26]=='0027_release467_caip_workshop_follies_maker_story_foundation.sql','Build 294 migration must be canonical version 27')
for token in (
 'CREATE TABLE IF NOT EXISTS creative_project_maker_story_profiles',
 'CREATE TABLE IF NOT EXISTS creative_project_maker_story_workstations',
 'REFERENCES creative_work_projects(creative_work_project_id)',
 'REFERENCES inventory_processes(inventory_process_id)',
 'REFERENCES site_item_inventory(site_item_inventory_id)',
 "story_kind IN ('ordinary_project','workshop_folly','experiment','maker_story','research_learning')",
 "outcome_status IN ('unknown','win','partial_win','failure')",
 'PRIMARY KEY(creative_work_project_id, site_item_inventory_id)'
):
    q(token in mig,'Build 294 canonical migration missing '+token)
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','CREATE INDEX','DROP INDEX'):
    q(forbidden not in api.upper(),f'Build 294 Creative Process API contains request-time DDL: {forbidden}')

for token in (
 'async function makerStoryContext','creative_project_maker_story_profiles','creative_project_maker_story_workstations',
 "inventory_workstation_roles iwr","iwr.workstation_role='station'","action==='save_maker_story'",
 'workstation_site_item_inventory_ids','maker_story_foundation_build:294',
 'No Product, media, Content Studio package or publication was duplicated.'
):
    q(token in api,'Build 294 Creative Process contract missing '+token)
save_start=api.find("action==='save_maker_story'")
save_end=api.find("action==='add_event'",save_start)
save=api[save_start:save_end] if save_start>=0 and save_end>save_start else ''
q(save_start>=0 and save_end>save_start,'Build 294 save_maker_story action segment missing')
for forbidden in ('INSERT INTO products','INSERT INTO content_projects','INSERT INTO content_publications','INSERT INTO social_post_queue','site_inventory_movements'):
    q(forbidden not in save,'Build 294 maker-story save may not mutate parallel/downstream authority: '+forbidden)

for token in (
 'function makerStoryPanel','data-build294-maker-story','Workshop folly / we tried this','Specific workstation tools used',
 "data-maker-workstation","action:'save_maker_story'",'public_story_candidate'
):
    q(token in ui,'Build 294 operator UI missing '+token)
q(('/public/js/admin-creative-process.js?v=467b294' in page) or (307<=int(p.get('build') or 0)<319 and '/public/js/admin-creative-process.js?v=467b307' in page) or (int(p.get('build') or 0)>=319 and '/public/js/admin-creative-process.js?v=467b319' in page) or (int(p.get('build') or 0)>=326 and '/public/js/admin-creative-process.js?v=467b326' in page),'Build 294 Creative Process cache identity missing')
q('Build 294 Maker Story foundation:' in page,'Build 294 Creative Process safety statement missing')

q(caip_root==caip_api,'Creative Asset Intelligence helper copies must remain byte-identical')
for token in ('async function makerStorySourceContext','maker_story: makerStory.profile','maker_story_workstations: makerStory.workstations','maker_story_foundation_build: 294',"maker_story_source_authority: 'creative_process'","workstation_identity_authority: 'inventory'"):
    q(token in caip_api,'Build 294 CAIP snapshot integration missing '+token)
caip_start=caip_api.find('export async function ensureCreativeProjectFromCreativeWorkProject')
caip_end=caip_api.find('export async function syncCreativeProjectFromContentProject',caip_start)
caip_seg=caip_api[caip_start:caip_end] if caip_start>=0 and caip_end>caip_start else ''
q("source_type='creative_work_project'" in caip_seg and 'ON CONFLICT(source_type, source_id) DO UPDATE SET' in caip_seg,'Build 294 must retain Build 271 idempotent CAIP identity')
q('INSERT INTO products' not in caip_seg and 'INSERT INTO content_projects' not in caip_seg,'Build 294 CAIP refresh may not fabricate Product/Content Studio rows')

for token in ('const makerStory=','maker_story_foundation:true','maker_story_kind:makerStoryKind','maker_story_foundation_build:294',"journalLabel:makerStoryActive?'Workshop Journal':'Project Journal'",'duplicate_project_created:false'):
    q(token in content,'Build 294 Content Studio reuse missing '+token)
q("source_type='creative_project'" in content and 'ON CONFLICT(source_type,source_id) DO UPDATE SET' in content,'Build 294 must retain Content Studio idempotent source identity')
q('no_auto_publish:true' in content,'Build 294 Content Studio must remain review-first/no-auto-publish')

x=subprocess.run([sys.executable,str(R/'scripts/release467_build294_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
print(x.stdout,end='');print(x.stderr,end='',file=sys.stderr);q(x.returncode==0,'Build 294 productless Folly identity regression failed')
for path in ('functions/api/admin/creative-process-compat.js','public/js/admin-creative-process.js','functions/api/_lib/creativeAssetIntelligence.js','functions/api/_lib/contentAutomationStudio.js'):
    n=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(n.returncode==0,path+' syntax failed: '+(n.stderr or n.stdout)[-1200:])
q("run_current_contract('scripts/release467_build294_gate.py','Release 467 Build 294')" in sysgate,'System Gate missing Build 294')
q(int(p.get('build') or 0)>=294,'Current authority must retain Build 294 or successor')
if int(p.get('build') or 0)==294:
    q(p.get('title')=='CAIP Workshop Follies & Maker Story Foundation' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 294 pointer mismatch')
    q(int(p.get('next_build') or 0)==295 and p.get('next_build_title')=='Storefront Buyer Journey Simplification','Build 294 successor pointer mismatch')
print('RELEASE 467 BUILD 294 CAIP WORKSHOP FOLLIES & MAKER STORY FOUNDATION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Creative Process → one CAIP workspace → one Content Studio package: RETAINED')
print('Productless Folly/Maker Story path: GREEN')
print('Automatic publication: FORBIDDEN')
print('Next: Build 295 — Storefront Buyer Journey Simplification')
