#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build348-content-adoption-discovery-outcomes-renewal-viii.json')
prev=j('release467-build347-maker-story-advancement-publication-readiness-continuity-v.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build348_outcomes_measurement.sql')
verify=t('scripts/release467_build348_verify_measurement.mjs')
wf=t('.github/workflows/release467-build348-content-adoption-discovery-outcomes-renewal-viii.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_343_348.md')

q(a.get('build')==348 and a.get('title')=='Content Adoption & Discovery Outcomes Renewal VIII','Build 348 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 347 Production closure not successor-ingested')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='2983bc6bf9e3a5376340e022183ab17f51c2ee4b' and fc.get('tree_sha')=='51d1c8d3fee195d238d99a2500025d546f3dee14','Build 347 exact Development closure missing')
q(pc.get('main_sha')=='ec311f0e54f0aa6b2d2eafb7a8b6c668cf194fae' and pc.get('tree_sha')=='51d1c8d3fee195d238d99a2500025d546f3dee14' and pc.get('state')=='PRODUCTION_GREEN','Build 347 Production checkpoint missing')
scope=a.get('scope') or {}
for key in ('full_path_remeasurement','build300_comparison','build306_comparison','build312_comparison','build318_comparison','build324_comparison','build330_comparison','build336_comparison','build342_comparison','build347_readiness_context','maker_story_coverage','review_state','publication','discovery','runtime','identity_integrity','d1_read_outcomes','seo_review_queue_continuity','search_console_freshness_rule','explicit_report_date_only_for_search_console_freshness','next_roadmap_from_observed_evidence_only'):
    q(scope.get(key) is True,'Build 348 scope missing '+key)
q(all(v is False for v in (a.get('safety') or {}).values()),'Build 348 safety boundary drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 348 measurement must remain read-only: '+forbidden.strip())
for token in ('Maker Story adoption/completeness','Buyer discovery/public telemetry 30d','Evidence-backed SEO review queue continuity','pragma_foreign_key_check',"report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')","q.report_date IS NOT NULL AND date(q.report_date)>=date('now','-30 days')"):q(token in sql,'Build 348 SQL missing '+token)
q("date(COALESCE(report_date,created_at))>=date('now','-30 days')" not in sql,'Build 348 must not substitute row creation time for Search Console report date')
for token in ('build300','build306','build312','build318','build324','build330','build336','build342','build347','ADOPTION_STABLE_EVIDENCE_GAPS_PERSIST','ADOPTION_PROGRESS_OBSERVED','REAL_DISCOVERY_EVIDENCE_OBSERVED','comparison_to_build342','automatic_story_generation:false','production_d1_contact:false'):q(token in verify,'Build 348 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','COMPARISON BASELINES: BUILDS 300 / 306 / 312 / 318 / 324 / 330 / 336 / 342','BUILD 347 READINESS CONTEXT: RETAINED','ROADMAP RENEWAL: OBSERVED EVIDENCE ONLY','BUSINESS DATA MUTATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 348 workflow boundary missing '+token)
q('Build 348 — Content Adoption & Discovery Outcomes Renewal VIII' in road,'Build 348 canonical roadmap entry missing')
q(int(p.get('build') or 0)>=348,'Current pointer must retain Build 348 or successor')
if int(p.get('build') or 0)==348:q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN'),'Build 348 current state invalid')
print('RELEASE 467 BUILD 348 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL VIII')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Successor roadmap remains evidence-determined until exact Development measurement')
