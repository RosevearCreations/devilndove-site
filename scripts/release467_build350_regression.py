#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build350-35th-promo-factual-evidence-completion-continuity-v.json')
prev=j('release467-build349-evidence-gap-execution-workbench-input-completion-continuity-iv.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/35th-promo-outcome-closure.js');cpapi=t('functions/api/admin/creative-process.js');ui=t('public/js/admin-creative-process.js');page=t('admin/creative-process/index.html')
sql=t('scripts/release467_build350_measurement.sql');verify=t('scripts/release467_build350_verify_measurement.mjs')
wf=t('.github/workflows/release467-build350-35th-promo-factual-evidence-completion-continuity-v.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_349_354.md')
oauthsec=t('functions/api/_lib/oauthSecurity.js');oauthp=t('functions/api/_lib/oauthProviders.js');start=t('functions/api/admin/oauth-start.js');callback=t('functions/api/social/oauth/_callback.js');etsy=t('functions/api/admin/etsy-oauth-acceptance.js');etsyui=t('public/js/admin-etsy-oauth-acceptance.js');ithtml=t('admin/it-integrations/index.html')
migration=t('migrations/canonical/0029_release467_etsy_oauth_shop_identity.sql');manifest=j('migrations/canonical/manifest.json')

q(a.get('build')==350 and a.get('title')=='35th Promo Factual Evidence Completion Continuity V','Build 350 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 349 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='af5070400e0b9fb0da8be48753dcfef7737230b8' and (prev.get('final_closure') or {}).get('tree_sha')=='c0f4a29f13d7f0bce5165f34a06c5140ec4f3ca1','Build 349 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='b4a2e20b96f7bbeea7a21136aa780d7425002891' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='c0f4a29f13d7f0bce5165f34a06c5140ec4f3ca1','Build 349 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {};e=a.get('etsy_connection_hardening') or {}
q(c.get('reuses_operator_action')=='record_story_execution_evidence','Build 350 must reuse factual intake')
q(c.get('readiness_only') is True and c.get('explicit_human_review_required') is True and c.get('automatic_story_review') is False and c.get('automatic_public_candidate') is False,'Build 350 review-first boundary mismatch')
q(c.get('placeholder_absence_text_does_not_satisfy_readiness') is True,'Build 350 placeholder guard missing')
q(c.get('next_build')==351 and c.get('next_build_title')=='Grey Hair Source Review & Story-Plan Completion Continuity V','Build 351 successor mismatch')
q(s.get('schema_change') is True,'Build 350 must declare canonical Etsy schema extension')
for k,v in s.items():
    if k!='schema_change': q(v is False,'Build 350 safety drift '+k)
for token in ('record_story_execution_evidence','STORY_EXECUTION_EVENT_TYPES','notes.length < 20','maker_story_auto_reviewed: false'):q(token in cpapi,'Build 350 factual intake authority missing '+token)
q('onRequestPost' not in api,'Build 350 closure endpoint must remain GET-only')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 350 measurement must remain read-only: '+forbidden.strip())
for token in ('execution_events','result_events','lesson_events','actual_result','lesson_learned','execution_rows_with_public_or_media_flags','pragma_foreign_key_check'):q(token in sql,'Build 350 measurement missing '+token)
for token in ('REAL_OUTCOME_EVIDENCE_STILL_REQUIRED','REAL_OUTCOME_EVIDENCE_PARTIAL','REAL_EVENTS_COMPLETE_MAKER_STORY_FACTS_STILL_REQUIRED','REAL_OUTCOME_FACTS_COMPLETE_READY_FOR_EXPLICIT_HUMAN_REVIEW','comparison_to_build349','placeholderGuard','substantiveFact','automatic_story_review:false','production_d1_contact:false'):q(token in verify,'Build 350 verifier missing '+token)
q('data-build350-factual-evidence-continuity' in page and '/public/js/admin-creative-process.js?v=467b350' in page,'Build 350 Creative Process page/cache marker missing')
q('Build 350 • factual evidence continuity V' in ui,'Build 350 Creative Process UI marker missing')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','AUTOMATIC STORY REVIEW: ZERO','PUBLIC CANDIDACY MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO','ETSY LISTING WRITES: ZERO'):q(token in wf,'Build 350 workflow boundary missing '+token)
q('Build 350 — 35th Promo Factual Evidence Completion Continuity V' in road and 'Build 351 — Grey Hair Source Review & Story-Plan Completion Continuity V' in road,'Build 350/351 roadmap continuity missing')
q(e.get('shop_id_auto_discovery') is True and e.get('shop_id_manual_variable_required') is False and e.get('provider_listing_writes_allowed') is False,'Build 350 Etsy authority drift')
for token in ('etsyDevelopmentAuthorizationOpen','oauthProviderAuthorizationOpen'):q(token in oauthsec,'Etsy Development OAuth gate missing '+token)
for token in ('discoverEtsyShop','/users/','/shops',"['shops_r','listings_r','listings_w']"):q(token in oauthp,'Etsy provider contract missing '+token)
q("contract.key === 'etsy'" in start or "contract.key==='etsy'" in start,'Etsy OAuth start bootstrap missing')
q('etsy_oauth_shop_connections' in callback,'Etsy callback must persist safe discovered shop identity')
q('provider_listing_writes_allowed:false' in etsy and 'remote_draft_creation_enabled:false' in etsy,'Etsy acceptance must keep listing writes locked')
q('Connect Etsy' in etsyui and 'etsy-oauth-acceptance' in ithtml,'Etsy operator connection UI missing')
files=[x.get('file') for x in manifest.get('migrations',[]) if isinstance(x,dict)]
q(len(files)>=29 and files[28]=='0029_release467_etsy_oauth_shop_identity.sql','Migration 0029 must be canonical version 29')
for token in ('etsy_oauth_shop_connections','ETSY_API_KEYSTRING','ETSY_SHARED_SECRET','ETSY_REDIRECT_URI'):q(token in migration,'Migration 0029 missing '+token)
q('ETSY_SHOP_ID' not in migration.split("required_config_keys_json=")[1].split("\n")[0],'ETSY_SHOP_ID must not remain a required fourth Cloudflare variable')
q(int(p.get('build') or 0)>=350,'Current pointer must retain Build 350 or successor')
if int(p.get('build') or 0)==350:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==351,'Build 350 current authority/successor mismatch')
print('RELEASE 467 BUILD 350 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY V + ETSY OAUTH HARDENING')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Real factual completeness can only produce explicit human-review readiness')
print('Etsy OAuth: Development-only; Shop ID auto-discovered; listing writes locked')
