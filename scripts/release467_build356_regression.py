#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build356-35th-promo-factual-evidence-completion-continuity-vi.json')
prev=j('release467-build355-evidence-gap-execution-workbench-input-completion-continuity-v.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build356_measurement.sql')
verify=t('scripts/release467_build356_verify_measurement.mjs')
wf=t('.github/workflows/release467-build356-35th-promo-factual-evidence-completion-continuity-vi.yml')
page=t('admin/creative-process/index.html')
ui=t('public/js/admin-creative-process.js')
api=t('functions/api/admin/35th-promo-outcome-closure.js')
varsdoc=t('docs/operations/DEVILNDOVE_PRODUCTION_VARIABLES_REFERENCE.md')
q(a.get('build')==356 and a.get('title')=='35th Promo Factual Evidence Completion Continuity VI','Build 356 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 355 Production closure not successor-ingested')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='31599bca8ead283f46a18bedbc19640c85f66faa' and fc.get('tree_sha')=='3be26b7b2497b1420c630c5ca891eda0a4aea0be','Build 355 exact Development closure missing')
q(pc.get('main_sha')=='1ee3dc44c7f51da27f5cb9e61960896db839df06' and pc.get('tree_sha')=='3be26b7b2497b1420c630c5ca891eda0a4aea0be','Build 355 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {};e=a.get('etsy_status') or {}
q(c.get('reuses_operator_action')=='record_story_execution_evidence','Build 356 must reuse factual intake')
q(c.get('readiness_only') is True and c.get('explicit_human_review_required') is True and c.get('automatic_story_review') is False and c.get('automatic_publication') is False,'Build 356 review-first boundary mismatch')
q(c.get('production_variable_reference_refresh') is True and c.get('secret_value_retrieval') is False,'Build 356 variable-reference boundary mismatch')
q(e.get('provider_response_observed')=='ETSY_TEMPORARY_ACCESS_RESTRICTION' and e.get('automatic_retry') is False and e.get('provider_bypass') is False,'Build 356 Etsy external restriction boundary mismatch')
q(all(v is False for v in s.values()),'Build 356 safety drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 356 measurement must remain read-only: '+forbidden.strip())
for token in ('execution_events','result_events','lesson_events','actual_result','lesson_learned','pragma_foreign_key_check'):q(token in sql,'Build 356 measurement missing '+token)
for token in ('REAL_OUTCOME_EVIDENCE_STILL_REQUIRED','REAL_OUTCOME_EVIDENCE_PARTIAL','REAL_EVENTS_COMPLETE_MAKER_STORY_FACTS_STILL_REQUIRED','REAL_OUTCOME_FACTS_COMPLETE_READY_FOR_EXPLICIT_HUMAN_REVIEW','production_d1_contact:false'):q(token in verify,'Build 356 verifier missing '+token)
q('data-build356-factual-evidence-continuity' in page and '/public/js/admin-creative-process.js?v=467b356' in page,'Build 356 Creative Process marker/cache missing')
q('BUILD356_CURRENT_CLIENT' in ui and 'BUILD356_CURRENT_API_IDENTITY' in api,'Build 356 UI/API identity missing')
for token in ('PUBLIC_SITE_URL','SITE_ORIGIN','ETSY_REDIRECT_URI','SESSION_SECRET','STRIPE_SECRET_KEY','PAYPAL_CLIENT_ID','FACEBOOK_PAGE_ID','PINTEREST_APP_ID','EMAIL_PROVIDER','BUSINESS_LEGAL_NAME','TMDB_READ_ACCESS_TOKEN','DB','PRODUCT_MEDIA_BUCKET','CAIP_PRIVATE_MEDIA_BUCKET'):q(token in varsdoc,'Production variables reference missing '+token)
q('https://devilndove.com/api/social/oauth/etsy/callback' in varsdoc,'Expected Etsy callback missing from variable reference')
q('secret values' in varsdoc.lower() and 'cannot be read back' in varsdoc.lower(),'Secret-value handling guidance missing')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','AUTOMATIC STORY REVIEW: ZERO','PROVIDER BYPASS: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 356 workflow boundary missing '+token)
q(int(p.get('build') or 0)>=356,'Current pointer must retain Build 356 or successor')
if int(p.get('build') or 0)==356:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==357,'Build 356 current authority/successor mismatch')
print('RELEASE 467 BUILD 356 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY VI')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
