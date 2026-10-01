#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build330-content-adoption-discovery-outcomes-renewal-v.json');prev=j('release467-build329-maker-story-advancement-publication-readiness-continuity-ii.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build330_outcomes_measurement.sql');verify=t('scripts/release467_build330_verify_measurement.mjs');wf=t('.github/workflows/release467-build330-content-adoption-discovery-outcomes-renewal-v.yml');road=t('docs/operations/RELEASE_467_EVIDENCE_ACTION_ADOPTION_BUILDS_325_330.md')
q(a.get('build')==330 and a.get('title')=='Content Adoption & Discovery Outcomes Renewal V','Build 330 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 329 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='aaeeb829d092d0174db29084e35380d83c0d620c' and (prev.get('final_closure') or {}).get('tree_sha')=='8310fde78f64bfb80aa2169c9a60a33685cd3d6e','Build 329 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='05bf93a1deba88f4222397f7288cae2851fc7278' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='8310fde78f64bfb80aa2169c9a60a33685cd3d6e','Build 329 Production checkpoint missing')
scope=a.get('scope') or {}
for key in ('full_path_remeasurement','build300_comparison','build306_comparison','build312_comparison','build318_comparison','build324_comparison','build329_readiness_context','maker_story_coverage','review_state','publication','discovery','runtime','identity_integrity','d1_read_outcomes','seo_review_queue_continuity','search_console_freshness_rule','next_roadmap_from_observed_evidence_only'):q(scope.get(key) is True,'Build 330 scope missing '+key)
q(all(v is False for v in (a.get('safety') or {}).values()),'Build 330 safety boundary drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 330 measurement must remain read-only: '+forbidden.strip())
for token in ('Maker Story adoption/completeness','Buyer discovery/public telemetry 30d','Evidence-backed SEO review queue continuity','pragma_foreign_key_check',"date(COALESCE(q.report_date,q.created_at))>=date('now','-30 days')"):q(token in sql,'Build 330 SQL missing '+token)
for token in ('build300','build306','build312','build318','build324','build329','ADOPTION_STABLE_EVIDENCE_GAPS_PERSIST','ADOPTION_PROGRESS_OBSERVED','REAL_DISCOVERY_EVIDENCE_OBSERVED','comparison_to_build324','automatic_story_generation:false','production_d1_contact:false'):q(token in verify,'Build 330 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','COMPARISON BASELINES: BUILDS 300 / 306 / 312 / 318 / 324','ROADMAP RENEWAL: OBSERVED EVIDENCE ONLY','BUSINESS DATA MUTATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 330 workflow boundary missing '+token)
q('Build 330 — Content Adoption & Discovery Outcomes Renewal V' in road,'Build 330 canonical roadmap entry missing')
q(a.get('measurement_state')=='EXACT_DEVELOPMENT_MEASURED_GREEN','Build 330 exact measured state missing')
q(a.get('roadmap_renewal_state')=='BUILDS_331_336_CREATED_FROM_OBSERVED_EVIDENCE','Build 330 roadmap renewal state missing')
q(a.get('next_roadmap')=='docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_331_336.md','Build 330 successor roadmap authority missing')
road2=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_331_336.md')
for token in ('Build 331 — Evidence Gap Execution Workbench & Input Completion Continuity','Build 332 — 35th Promo Factual Evidence Completion Continuity II','Build 333 — Grey Hair Source Review & Story-Plan Completion Continuity II','Build 334 — Search Console Real Export & Fresh Discovery Intake IV','Build 335 — Maker Story Advancement & Publication Readiness Continuity III','Build 336 — Content Adoption & Discovery Outcomes Renewal VI'):
 q(token in road2,'Build 330 renewed roadmap missing '+token)
q(int(p.get('build') or 0)>=330,'Current pointer must retain Build 330 or successor')
if int(p.get('build') or 0)==330:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==331,'Build 330 current authority/successor slot mismatch')
print('RELEASE 467 BUILD 330 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL V')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Observed Build 330 evidence renewed Builds 331-336')
