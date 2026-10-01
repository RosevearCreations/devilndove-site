#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build336-content-adoption-discovery-outcomes-renewal-vi.json')
prev=j('release467-build335-maker-story-advancement-publication-readiness-continuity-iii.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build336_outcomes_measurement.sql')
verify=t('scripts/release467_build336_verify_measurement.mjs')
wf=t('.github/workflows/release467-build336-content-adoption-discovery-outcomes-renewal-vi.yml')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_331_336.md')

q(a.get('build')==336 and a.get('title')=='Content Adoption & Discovery Outcomes Renewal VI','Build 336 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 335 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='bec1c4bf76cf69e6b42dc3768b1de22400e0b052' and (prev.get('final_closure') or {}).get('tree_sha')=='d8b3b0139055920106b78ee17b1a65b3cc19f3b4','Build 335 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='8bda25fe29647f23a4a3b4bcb3f0ded515ae2d87' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='d8b3b0139055920106b78ee17b1a65b3cc19f3b4','Build 335 Production checkpoint missing')

scope=a.get('scope') or {}
for key in ('full_path_remeasurement','build300_comparison','build306_comparison','build312_comparison','build318_comparison','build324_comparison','build330_comparison','build335_readiness_context','maker_story_coverage','review_state','publication','discovery','runtime','identity_integrity','d1_read_outcomes','seo_review_queue_continuity','search_console_freshness_rule','next_roadmap_from_observed_evidence_only'):
    q(scope.get(key) is True,'Build 336 scope missing '+key)
q(all(v is False for v in (a.get('safety') or {}).values()),'Build 336 safety boundary drift')

upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    q(forbidden not in upper,'Build 336 measurement must remain read-only: '+forbidden.strip())
for token in ('Maker Story adoption/completeness','Buyer discovery/public telemetry 30d','Evidence-backed SEO review queue continuity','pragma_foreign_key_check',"date(COALESCE(q.report_date,q.created_at))>=date('now','-30 days')"):
    q(token in sql,'Build 336 SQL missing '+token)
for token in ('build300','build306','build312','build318','build324','build330','build335','ADOPTION_STABLE_EVIDENCE_GAPS_PERSIST','ADOPTION_PROGRESS_OBSERVED','REAL_DISCOVERY_EVIDENCE_OBSERVED','comparison_to_build330','automatic_story_generation:false','production_d1_contact:false'):
    q(token in verify,'Build 336 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','COMPARISON BASELINES: BUILDS 300 / 306 / 312 / 318 / 324 / 330','BUILD 335 READINESS CONTEXT: RETAINED','ROADMAP RENEWAL: OBSERVED EVIDENCE ONLY','BUSINESS DATA MUTATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):
    q(token in wf,'Build 336 workflow boundary missing '+token)
q('Build 336 — Content Adoption & Discovery Outcomes Renewal VI' in road,'Build 336 canonical roadmap entry missing')

measured=str(a.get('measurement_state') or '').startswith('EXACT_DEVELOPMENT_MEASURED')
if measured:
    q(a.get('roadmap_renewal_state')=='BUILDS_337_342_CREATED_FROM_OBSERVED_EVIDENCE','Build 336 roadmap renewal state missing')
    nr=a.get('next_roadmap')
    q(nr=='docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_337_342.md','Build 336 successor roadmap authority missing')
    if nr:
        road2=t(nr)
        for token in (
          'Build 337 — Evidence Gap Execution Workbench & Input Completion Continuity II',
          'Build 338 — 35th Promo Factual Evidence Completion Continuity III',
          'Build 339 — Grey Hair Source Review & Story-Plan Completion Continuity III',
          'Build 340 — Search Console Real Export & Fresh Discovery Intake V',
          'Build 341 — Maker Story Advancement & Publication Readiness Continuity IV',
          'Build 342 — Content Adoption & Discovery Outcomes Renewal VII'):
            q(token in road2,'Build 336 renewed roadmap missing '+token)

q(int(p.get('build') or 0)>=336,'Current pointer must retain Build 336 or successor')
if int(p.get('build') or 0)==336:
    q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==337,'Build 336 current authority/successor slot mismatch')

print('RELEASE 467 BUILD 336 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL VI')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Successor roadmap remains evidence-determined until exact Development measurement')
