#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build342-content-adoption-discovery-outcomes-renewal-vii.json')
prev=j('release467-build341-maker-story-advancement-publication-readiness-continuity-iv.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build342_outcomes_measurement.sql')
verify=t('scripts/release467_build342_verify_measurement.mjs')
wf=t('.github/workflows/release467-build342-content-adoption-discovery-outcomes-renewal-vii.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_337_342.md')

q(a.get('build')==342 and a.get('title')=='Content Adoption & Discovery Outcomes Renewal VII','Build 342 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 341 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='84074c82d258c26d313a28a4b4735382c812a9dd' and (prev.get('final_closure') or {}).get('tree_sha')=='5e9a649b6f6eb8e8bb2a10d7c17b417c9b63d985','Build 341 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='ff5b1106ee5515106fd501909461fc4078f24edd' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='5e9a649b6f6eb8e8bb2a10d7c17b417c9b63d985','Build 341 Production checkpoint missing')

scope=a.get('scope') or {}
for key in ('full_path_remeasurement','build300_comparison','build306_comparison','build312_comparison','build318_comparison','build324_comparison','build330_comparison','build336_comparison','build341_readiness_context','maker_story_coverage','review_state','publication','discovery','runtime','identity_integrity','d1_read_outcomes','seo_review_queue_continuity','search_console_freshness_rule','explicit_report_date_only_for_search_console_freshness','next_roadmap_from_observed_evidence_only'):
    q(scope.get(key) is True,'Build 342 scope missing '+key)
q(all(v is False for v in (a.get('safety') or {}).values()),'Build 342 safety boundary drift')

upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    q(forbidden not in upper,'Build 342 measurement must remain read-only: '+forbidden.strip())
for token in ('Maker Story adoption/completeness','Buyer discovery/public telemetry 30d','Evidence-backed SEO review queue continuity','pragma_foreign_key_check',"report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')","q.report_date IS NOT NULL AND date(q.report_date)>=date('now','-30 days')"):
    q(token in sql,'Build 342 SQL missing '+token)
q("date(COALESCE(report_date,created_at))>=date('now','-30 days')" not in sql,'Build 342 must not substitute row creation time for Search Console report date')
q("date(COALESCE(q.report_date,q.created_at))>=date('now','-30 days')" not in sql,'Build 342 SEO support must not substitute row creation time for report date')
for token in ('build300','build306','build312','build318','build324','build330','build336','build341','ADOPTION_STABLE_EVIDENCE_GAPS_PERSIST','ADOPTION_PROGRESS_OBSERVED','REAL_DISCOVERY_EVIDENCE_OBSERVED','comparison_to_build336','automatic_story_generation:false','production_d1_contact:false'):
    q(token in verify,'Build 342 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','COMPARISON BASELINES: BUILDS 300 / 306 / 312 / 318 / 324 / 330 / 336','BUILD 341 READINESS CONTEXT: RETAINED','ROADMAP RENEWAL: OBSERVED EVIDENCE ONLY','BUSINESS DATA MUTATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):
    q(token in wf,'Build 342 workflow boundary missing '+token)
q('Build 342 — Content Adoption & Discovery Outcomes Renewal VII' in road,'Build 342 canonical roadmap entry missing')

measured=str(a.get('measurement_state') or '').startswith('EXACT_DEVELOPMENT_MEASURED')
if measured:
    q(a.get('roadmap_renewal_state')=='BUILDS_343_348_CREATED_FROM_OBSERVED_EVIDENCE','Build 342 roadmap renewal state missing')
    nr=a.get('next_roadmap')
    q(nr=='docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_343_348.md','Build 342 successor roadmap authority missing')
    if nr:
        road2=t(nr)
        for token in (
          'Build 343 — Evidence Gap Execution Workbench & Input Completion Continuity III',
          'Build 344 — 35th Promo Factual Evidence Completion Continuity IV',
          'Build 345 — Grey Hair Source Review & Story-Plan Completion Continuity IV',
          'Build 346 — Search Console Real Export & Fresh Discovery Intake VI',
          'Build 347 — Maker Story Advancement & Publication Readiness Continuity V',
          'Build 348 — Content Adoption & Discovery Outcomes Renewal VIII'):
            q(token in road2,'Build 342 renewed roadmap missing '+token)

q(int(p.get('build') or 0)>=342,'Current pointer must retain Build 342 or successor')
if int(p.get('build') or 0)==342:
    q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==343,'Build 342 current authority/successor slot mismatch')

print('RELEASE 467 BUILD 342 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL VII')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Successor roadmap remains evidence-determined until exact Development measurement')
