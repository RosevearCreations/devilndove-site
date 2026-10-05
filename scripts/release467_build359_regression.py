#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build359-maker-story-advancement-publication-readiness-continuity-vii.json')
prev=j('release467-build358-search-console-real-export-fresh-discovery-intake-viii.json')
p=j('current-development-authority.json');manifest=j('migrations/canonical/manifest.json')
sql=t('scripts/release467_build359_continuity.sql');verify=t('scripts/release467_build359_verify_continuity.mjs')
wf=t('.github/workflows/release467-build359-maker-story-advancement-publication-readiness-continuity-vii.yml')
css=t('css/inventory-card-view-v359.css');page=t('admin/inventory-operations/index.html');ui=t('public/js/admin-site-item-inventory.js')
mig=t('migrations/canonical/0030_release467_inventory_workstation_category_additions.sql')
preflight=t('functions/api/admin/current-deployment-preflight.js');sanity=t('scripts/repository_forward_sanity.py')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_355_360.md')
q(a.get('build')==359 and a.get('title')=='Maker Story Advancement & Publication Readiness Continuity VII','Build 359 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 358 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='66f32dd208f6337aa2212c23441652057c7fb7bd' and (prev.get('final_closure') or {}).get('tree_sha')=='0bf65d6acf57b6ae8b6562bfcb2b658716d13470','Build 358 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='88be5197b9c84814418116c4a7a3dd24ede01f34' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='0bf65d6acf57b6ae8b6562bfcb2b658716d13470','Build 358 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('expected_active_projects')==5 and c.get('coverage_population')=='ALL_ACTIVE_CREATIVE_PROJECTS','Build 359 five-project coverage mismatch')
q(c.get('explicit_story_review_required') is True and c.get('automatic_publication') is False,'Build 359 review/publication boundary mismatch')
q(c.get('inventory_card_max_columns')==3 and c.get('inventory_card_field_overflow_forbidden') is True,'Build 359 Card View contract mismatch')
q(c.get('operator_requested_categories')==['Jewelry & Forge Work','Auto Detailing'],'Build 359 workstation/category request mismatch')
q(c.get('next_build')==360 and c.get('next_build_title')=='Content Adoption & Discovery Outcomes Renewal X','Build 360 successor mismatch')
q(all(v is False for v in s.values()),'Build 359 safety authority drift')
files=[x.get('file') for x in manifest.get('migrations',[]) if isinstance(x,dict)]
q(len(files)>=30 and files[29]=='0030_release467_inventory_workstation_category_additions.sql','Migration 0030 must be canonical version 30')
for token in ("'jewelry-forge-work'","'Jewelry & Forge Work'","'auto-detailing'","'Auto Detailing'","INSERT OR IGNORE INTO inventory_processes"):q(token in mig,'Migration 0030 missing '+token)
for forbidden in ('DELETE FROM INVENTORY_PROCESSES','DROP TABLE','ALTER TABLE'):q(forbidden not in mig.upper(),'Migration 0030 must preserve existing taxonomy/assignments: '+forbidden)
for token in ('grid-template-columns:repeat(3,minmax(0,1fr))','@media(max-width:1200px)','@media(max-width:760px)','.site-inventory-grid-identity','min-width:0!important','position:static!important'):q(token in css,'Build 359 Card View CSS missing '+token)
q('/css/inventory-card-view-v359.css?v=359.1' in page and '/public/js/admin-site-item-inventory.js?v=467b359' in page,'Inventory cache identity missing Build 359')
q('BUILD359_CARD_LAYOUT_AND_WORKSTATION_TAXONOMY' in ui,'Inventory Build 359 JS marker missing')
q('0030_release467_inventory_workstation_category_additions.sql' in preflight and '===30' in preflight,'Deployment Preflight not advanced through migration 0030')
q('0030_release467_inventory_workstation_category_additions.sql' in sanity and 'through 0030' in sanity,'Repository forward sanity not advanced through migration 0030')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 359 Maker Story measurement must remain read-only: '+forbidden.strip())
for token in ('placeholderGuard','PUBLISHED_REVIEWED_STORY','FACTUAL_OUTCOME_EVIDENCE_REQUIRED','publication_mutation:false','production_d1_contact:false'):q(token in verify,'Build 359 verifier missing '+token)
for token in ('push:','branches: [dev]','D1_ONE_SHOT_EVIDENCE_CAPTURE','FIVE ACTIVE PROJECTS: READ-ONLY ADVANCEMENT','AUTOMATIC PUBLICATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 359 workflow boundary missing '+token)
q('Build 360 — Content Adoption & Discovery Outcomes Renewal X' in road,'Build 360 roadmap missing')
q(int(p.get('build') or 0)>=359,'Current pointer must retain Build 359 or successor')
if int(p.get('build') or 0)==359:q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN') and int(p.get('next_build') or 0)==360,'Build 359 current authority/successor mismatch')
for path in ('public/js/admin-site-item-inventory.js','scripts/release467_build359_verify_continuity.mjs','functions/api/admin/current-deployment-preflight.js','functions/api/_lib/currentReliability.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout)[-1200:])
print('RELEASE 467 BUILD 359 MAKER STORY ADVANCEMENT & PUBLICATION READINESS CONTINUITY VII')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Inventory Card View <=3 columns; Jewelry & Forge Work and Auto Detailing use canonical inventory_processes migration 0030.')
