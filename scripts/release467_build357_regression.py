#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1]; F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok: F.append(msg)

a=j('release467-build357-grey-hair-source-review-story-plan-completion-continuity-vi.json')
prev=j('release467-build356-35th-promo-factual-evidence-completion-continuity-vi.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build357_measurement.sql')
verify=t('scripts/release467_build357_verify_measurement.mjs')
api=t('functions/api/admin/grey-hair-story-readiness.js')
ui=t('public/js/admin-grey-hair-story-readiness-v320.js')
page=t('admin/grey-hair-story-readiness/index.html')
callback=t('functions/api/social/oauth/_callback.js')
providers=t('functions/api/_lib/oauthProviders.js')
inventory=t('public/js/admin-site-item-inventory.js')
styles=t('css/styles.css')
inventory_page=t('admin/inventory-operations/index.html')
wf=t('.github/workflows/release467-build357-grey-hair-source-review-story-plan-completion-continuity-vi.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_355_360.md')

q(a.get('build')==357 and a.get('title')=='Grey Hair Source Review & Story-Plan Completion Continuity VI','Build 357 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 356 Production closure not successor-ingested')
fc=prev.get('final_closure') or {}; pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='e6b1c66ec636997623b90770ef86eaedc1bfc5ed' and fc.get('tree_sha')=='30ed420bc2ad1dbbb24ff2457496db23060f30d3','Build 356 exact Development closure missing')
q(pc.get('main_sha')=='b33ced533a4fd86e418516ca7b270387ed8bc7ce' and pc.get('tree_sha')=='30ed420bc2ad1dbbb24ff2457496db23060f30d3','Build 356 Production checkpoint missing')

c=a.get('contract') or {}; s=a.get('safety') or {}
for k in ('reuses_build351_measurement_model','evidence_review_must_be_complete','explicit_human_evidence_review_required','explicit_human_story_plan_review_required','workspace_read_only','etsy_callback_fail_safe_recovery','etsy_identity_fetch_reduced_when_token_subject_available','inventory_card_view_restored','inventory_card_view_persisted_locally'):
    q(c.get(k) is True,'Build 357 contract missing '+k)
for k in ('raw_private_urls_exposed','automatic_evidence_approval','automatic_story_plan_generation','automatic_story_plan_review','automatic_maker_story_profile','automatic_publication'):
    q(c.get(k) is False,'Build 357 review-first boundary drift '+k)
q(all(v is False for v in s.values()),'Build 357 safety boundary drift')
q(c.get('next_build')==358 and c.get('next_build_title')=='Search Console Real Export & Fresh Discovery Intake VIII','Build 358 successor mismatch')

upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    q(forbidden not in upper,'Build 357 measurement must remain read-only: '+forbidden.strip())
for token in ('source_evidence_needs_review','approved_source_evidence','confirmed_capture_groups','confirmed_capture_tracks','reviewed_story_plans','source_backed_story_items','maker_story_profiles','pragma_foreign_key_check'):
    q(token in sql,'Build 357 measurement missing '+token)
for token in ('SOURCE_EVIDENCE_REVIEW_REQUIRED','APPROVED_SOURCE_EVIDENCE_INSUFFICIENT','STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED','HUMAN_REVIEWED_STORY_PLAN_REQUIRED','SOURCE_BACKED_STORY_ITEMS_REQUIRED','GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION','production_d1_contact:false'):
    q(token in verify,'Build 357 verifier missing '+token)

q("const RELEASE=467,BUILD=357,TITLE='Grey Hair Source Review & Story-Plan Completion Continuity VI'" in api,'Build 357 Grey Hair API identity missing')
q('Build 357 source review &amp; story-plan continuity VI' in ui,'Build 357 Grey Hair UI identity missing')
q('/public/js/admin-grey-hair-story-readiness-v320.js?v=467b357' in page,'Build 357 Grey Hair cache identity missing')

q('function createOAuthCallbackCore' in callback and 'oauth_callback_fail_safe' in callback,'Build 357 Etsy callback fail-safe wrapper missing')
q("identity_source:'etsy_access_token_subject'" in providers,'Build 357 Etsy token-subject bootstrap missing')
q('siteInventoryCardViewButton' in inventory and 'dd_inventory_display_mode_v357' in inventory,'Build 357 Inventory Card View control/persistence missing')
q('.site-inventory-table-wrap.is-card-view' in styles,'Build 357 Inventory Card View CSS missing')
q('/public/js/admin-site-item-inventory.js?v=467b357' in inventory_page,'Build 357 Inventory JS cache identity missing')

for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','EVIDENCE APPROVAL MUTATION: ZERO','STORY PLAN REVIEW MUTATION: ZERO','ETSY CALLBACK FAIL-SAFE: SOURCE ONLY','ETSY LISTING WRITES: ZERO','INVENTORY CARD VIEW: PRESENTATION ONLY','PRODUCTION D1 CONTACT: ZERO'):
    q(token in wf,'Build 357 workflow boundary missing '+token)
q('Build 357 — Grey Hair Source Review & Story-Plan Completion Continuity VI' in road and 'Build 358 — Search Console Real Export & Fresh Discovery Intake VIII' in road,'Build 357/358 roadmap continuity missing')

q(int(p.get('build') or 0)>=357,'Current pointer must retain Build 357 or successor')
if int(p.get('build') or 0)==357:
    q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==358,'Build 357 current authority/successor mismatch')

print('RELEASE 467 BUILD 357 GREY HAIR SOURCE REVIEW & STORY-PLAN COMPLETION CONTINUITY VI')
if F:
    print('FAIL'); [print('-',x) for x in F]; sys.exit(1)
print('PASS')
print('Etsy callback fail-safe and Inventory Card View restoration are source-proven; Grey Hair remains review-first.')
