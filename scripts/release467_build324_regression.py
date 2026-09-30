#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build324-content-adoption-discovery-outcomes-renewal-iv.json')
prev=j('release467-build323-maker-story-coverage-publication-readiness-continuity.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build324_outcomes_measurement.sql')
verify=t('scripts/release467_build324_verify_measurement.mjs')
wf=t('.github/workflows/release467-build324-content-adoption-discovery-outcomes-renewal-iv.yml')
doc=t('docs/operations/RELEASE_467_BUILD_324_CONTENT_ADOPTION_DISCOVERY_OUTCOMES_RENEWAL_IV.md')

q(a.get('build')==324 and a.get('title')=='Content Adoption & Discovery Outcomes Renewal IV','Build 324 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 323 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='88db75c27e6817212fbed809294bd593ab049bb2','Build 323 final dev SHA missing')
q((prev.get('final_closure') or {}).get('tree_sha')=='9116bd69e701e15e464f5ea4c9a4e41d43c37974','Build 323 final tree missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='14418df3be9d34baa3dd3436777f7911f022f39b','Build 323 Production checkpoint missing')
scope=a.get('scope') or {}
for key in ('full_path_remeasurement','build300_comparison','build306_comparison','build312_comparison','build318_comparison','maker_story_coverage','review_state','publication','discovery','runtime','identity_integrity','d1_read_outcomes','next_roadmap_from_observed_evidence_only'):
    q(scope.get(key) is True,'Build 324 scope missing '+key)
s=a.get('safety') or {}
q(all(v is False for v in s.values()),'Build 324 safety boundary drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    q(forbidden not in upper,'Build 324 measurement must remain read-only: '+forbidden.strip())
for token in ('Maker Story adoption/completeness','Buyer discovery/public telemetry 30d','Evidence-backed SEO review queue continuity','Remaining third-project Maker Story readiness after Build 323','pragma_foreign_key_check'):
    q(token in sql,'Build 324 SQL missing '+token)
for token in ('build300','build306','build312','build318','ADOPTION_STABLE_EVIDENCE_GAPS_PERSIST','ADOPTION_PROGRESS_OBSERVED','REAL_DISCOVERY_EVIDENCE_OBSERVED','comparison_to_build318','automatic_story_generation:false','production_d1_contact:false'):
    q(token in verify,'Build 324 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','ROADMAP RENEWAL: OBSERVED EVIDENCE ONLY','COMPARISON BASELINES: BUILDS 300 / 306 / 312 / 318','BUSINESS DATA MUTATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):
    q(token in wf,'Build 324 workflow boundary missing '+token)
for token in ('same 18-statement outcomes model as Build 318','successor roadmap is intentionally not selected from assumptions','future queue has not run out'):
    q(token.lower() in doc.lower(),'Build 324 documentation missing '+token)
q(int(p.get('build') or 0)>=324,'Current pointer must retain Build 324 or successor')
if int(p.get('build') or 0)==324:
    q(p.get('state')=='DEVELOPMENT_GREEN','Build 324 current authority must be DEVELOPMENT_GREEN')
print('RELEASE 467 BUILD 324 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL IV')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Roadmap renewal remains evidence-driven and measurement-first')
