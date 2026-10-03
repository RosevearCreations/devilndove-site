#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build354-content-adoption-discovery-outcomes-renewal-ix.json');prev=j('release467-build353-maker-story-advancement-publication-readiness-continuity-vi.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build354_outcomes_measurement.sql');verify=t('scripts/release467_build354_verify_measurement.mjs');wf=t('.github/workflows/release467-build354-content-adoption-discovery-outcomes-renewal-ix.yml')
sec=t('functions/api/_lib/oauthSecurity.js');etsy=t('functions/api/admin/etsy-oauth-acceptance.js');ui=t('public/js/admin-etsy-oauth-acceptance.js');html=t('admin/it-integrations/index.html');policy=t('docs/operations/OPERATOR_TESTING_SURFACE_POLICY.md')
q(a.get('build')==354 and a.get('title')=='Content Adoption & Discovery Outcomes Renewal IX','Build 354 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 353 Production closure not successor-ingested')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='2076cc66d5ae860de62bf9775820e5dc228e491c' and fc.get('tree_sha')=='56cc33ace347ddfb1ca779c805711dc19cc7eabb','Build 353 exact Development closure missing')
q(pc.get('main_sha')=='8139d25fa79937e1b0acb141f88186878fe0e964' and pc.get('tree_sha')=='56cc33ace347ddfb1ca779c805711dc19cc7eabb' and pc.get('state')=='PRODUCTION_GREEN','Build 353 Production checkpoint missing')
scope=a.get('scope') or {}
for key in ('full_path_remeasurement','build300_comparison','build306_comparison','build312_comparison','build318_comparison','build324_comparison','build330_comparison','build336_comparison','build342_comparison','build348_comparison','build353_readiness_context','maker_story_coverage','review_state','publication','discovery','runtime','identity_integrity','d1_read_outcomes','seo_review_queue_continuity','search_console_freshness_rule','explicit_report_date_only_for_search_console_freshness','next_roadmap_from_observed_evidence_only','etsy_main_site_oauth_acceptance'):
 q(scope.get(key) is True,'Build 354 scope missing '+key)
q(scope.get('operator_testing_surface')=='MAIN_PRODUCTION_DIRECT' and scope.get('operator_manual_preview_testing') is False,'Retained operator test-surface decision missing')
q(all(v is False for v in (a.get('safety') or {}).values()),'Build 354 safety boundary drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 354 measurement must remain read-only: '+forbidden.strip())
for token in ('Maker Story adoption/completeness','Buyer discovery/public telemetry 30d','Evidence-backed SEO review queue continuity','pragma_foreign_key_check',"report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')","q.report_date IS NOT NULL AND date(q.report_date)>=date('now','-30 days')"):q(token in sql,'Build 354 SQL missing '+token)
for token in ('build300','build306','build312','build318','build324','build330','build336','build342','build348','build353','ADOPTION_STABLE_EVIDENCE_GAPS_PERSIST','ADOPTION_PROGRESS_OBSERVED','REAL_DISCOVERY_EVIDENCE_OBSERVED','comparison_to_build348','automatic_story_generation:false','production_d1_contact:false'):q(token in verify,'Build 354 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','COMPARISON BASELINES: BUILDS 300 / 306 / 312 / 318 / 324 / 330 / 336 / 342 / 348','BUILD 353 READINESS CONTEXT: RETAINED','ROADMAP RENEWAL: OBSERVED EVIDENCE ONLY','BUSINESS DATA MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 354 workflow boundary missing '+token)
q("host==='devilndove.com'||host==='www.devilndove.com'" in sec,'Etsy main-site OAuth host gate missing')
q('main_site_operator_acceptance:true' in etsy and 'redirect_main_ready:redirectMainReady' in etsy,'Etsy main-site status contract missing')
q('https://devilndove.com/api/social/oauth/etsy/callback' in etsy,'Etsy main redirect contract missing')
q('Etsy main-site connection panel' in ui and 'Etsy main-site connection' in html,'Etsy main-site UI authority missing')
q('https://devilndove.com/admin/it-integrations/' in policy and 'not the normal operator/manual testing surface' in policy,'Operator testing source-of-truth policy missing')
q(int(p.get('build') or 0)>=354,'Current pointer must retain Build 354 or successor')
if int(p.get('build') or 0)==354:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==355,'Build 354 current authority/successor mismatch')
print('RELEASE 467 BUILD 354 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL IX')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
