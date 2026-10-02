#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build347-maker-story-advancement-publication-readiness-continuity-v.json')
prev=j('release467-build346-search-console-real-export-fresh-discovery-intake-vi.json')
p=j('current-development-authority.json')
manifest=j('migrations/canonical/manifest.json')
sql=t('scripts/release467_build347_continuity.sql');verify=t('scripts/release467_build347_verify_continuity.mjs')
wf=t('.github/workflows/release467-build347-maker-story-advancement-publication-readiness-continuity-v.yml')
ui=t('public/js/admin-site-item-inventory.js');api=t('functions/api/admin/site-item-inventory.js')
notif=t('functions/api/admin/notifications.js');settings=t('functions/api/admin/app-settings.js')
migration=t('migrations/canonical/0028_release467_inventory_all_stations_current_location.sql')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_343_348.md');sanity=t('scripts/repository_forward_sanity.py')
q(a.get('build')==347 and a.get('title')=='Maker Story Advancement & Publication Readiness Continuity V','Build 347 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 346 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='0f58e0243b5f4ca4b78278972e76b3514a395414' and (prev.get('final_closure') or {}).get('tree_sha')=='19e7512f525608ce4a0e5dbf683be85d38a3165a','Build 346 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='f6f0d17f0cd8b7a879a8b771c236915fc39cb0c3' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='19e7512f525608ce4a0e5dbf683be85d38a3165a','Build 346 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {};op=a.get('operator_requested_inventory_patch') or {}
q(c.get('reuses_build329_maker_story_authorities') is True and c.get('reuses_build335_measurement_model') is True,'Build 347 retained Maker Story authority mismatch')
q(c.get('expected_active_projects')==5 and c.get('coverage_population')=='ALL_ACTIVE_CREATIVE_PROJECTS','Build 347 five-project coverage contract mismatch')
q(c.get('substantive_non_placeholder_result_and_lesson_required') is True and c.get('promo35_real_execution_result_lesson_events_required') is True,'Build 347 factual evidence guard mismatch')
q(c.get('explicit_story_review_required') is True and c.get('public_story_candidate_required') is True and c.get('approved_content_copy_required') is True and c.get('locked_content_copy_required') is True,'Build 347 review/copy readiness contract mismatch')
q(c.get('next_build')==348 and c.get('next_build_title')=='Content Adoption & Discovery Outcomes Renewal VIII','Build 348 successor mismatch')
q(all(v is False for v in s.values()),'Build 347 Maker Story safety authority drift')
q(op.get('direct_page_jump') is True and op.get('canonical_all_stations_category') is True and op.get('current_location_independent_of_usage_category') is True,'Inventory operator patch contract mismatch')
q(op.get('development_first') is True and op.get('production_before_dependent_code') is True and op.get('request_time_schema_mutation') is False,'Inventory migration boundary mismatch')
files=[x.get('file') for x in manifest.get('migrations',[]) if isinstance(x,dict)]
q(len(files)>=28 and files[27]=='0028_release467_inventory_all_stations_current_location.sql','Migration 0028 must be canonical version 28')
for token in ('All Stations','inventory_current_locations','current_location_site_item_inventory_id','ON DELETE SET NULL'):q(token in migration,'Migration 0028 missing '+token)
for token in ('siteInventoryPageJump','siteInventoryGoToPage','siteInventoryCurrentLocation','current_location_site_item_inventory_id','currentLocationOptionsMarkup'):q(token in ui,'Inventory UI missing '+token)
for token in ('inventory_current_locations','current_location_site_item_inventory_id','validateCurrentLocation','saveCurrentLocation'):q(token in api,'Inventory API missing '+token)
for body,label in ((notif,'notifications'),(settings,'app-settings')):
    q('getAdminUserFromRequest' in body and 'getDb' in body and '../_lib/adminAudit.js' in body,f'{label} must use shared admin auth')
    q('function getBearerToken' not in body,f'{label} retained stale bearer-only auth')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 347 Maker Story measurement must remain read-only: '+forbidden.strip())
for token in ('placeholderGuard','substantiveFact','PUBLISHED_REVIEWED_STORY','FACTUAL_OUTCOME_EVIDENCE_REQUIRED','publication_mutation:false','production_d1_contact:false'):q(token in verify,'Build 347 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','FIVE ACTIVE PROJECTS: READ-ONLY ADVANCEMENT','SUBSTANTIVE RESULT/LESSON FACTS: REQUIRED','HUMAN STORY REVIEW: REQUIRED','MEDIA RIGHTS: SEPARATE NEVER INFERRED','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 347 workflow boundary missing '+token)
q('Build 348 — Content Adoption & Discovery Outcomes Renewal VIII' in road,'Build 348 successor roadmap missing')
q('0028_release467_inventory_all_stations_current_location.sql' in sanity,'Forward sanity must include migration 0028')
q(int(p.get('build') or 0)>=347,'Current pointer must retain Build 347 or successor')
if int(p.get('build') or 0)==347:
    q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN'),'Build 347 current state invalid')
    q(int(p.get('next_build') or 0)==348,'Build 348 successor pointer missing')
print('RELEASE 467 BUILD 347 MAKER STORY ADVANCEMENT & PUBLICATION READINESS CONTINUITY V')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Maker Story lane remains factual/human-reviewed; Inventory QoL migration is additive and Development-first.')
