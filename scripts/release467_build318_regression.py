#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build318-content-adoption-discovery-outcomes-renewal-iii.json')
prev=j('release467-build317-third-project-maker-story-readiness-evidence-selection.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build318_outcomes_measurement.sql')
verify=t('scripts/release467_build318_verify_measurement.mjs')
wf=t('.github/workflows/release467-build318-content-adoption-discovery-outcomes-renewal-iii.yml')
q(a.get('build')==318 and a.get('title')=='Content Adoption & Discovery Outcomes Renewal III','Build 318 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 317 Production closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='66c944cfcff4c60ad90ff0df00d7bbbd67a1c1f5' and (prev.get('final_closure') or {}).get('tree_sha')=='b721482133a03fd851f36078320527784e247247','Build 317 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='9d2ccc468ea810fdd6cf0e6f2527d50c6418876e','Build 317 Production checkpoint missing')
s=a.get('safety') or {}
q(all(v is False for v in s.values()),'Build 318 safety boundary drift')
scope=a.get('scope') or {}
for key in ('build300_comparison','build306_comparison','build312_comparison','builds313_317_outcome_rollup','next_roadmap_from_observed_evidence_only'):q(scope.get(key) is True,'Build 318 scope missing '+key)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 318 measurement must remain read-only: '+forbidden.strip())
for token in ('Maker Story adoption/completeness','Buyer discovery/public telemetry 30d','Evidence-backed SEO review queue continuity','Remaining third-project Maker Story readiness after Build 317','pragma_foreign_key_check'):q(token in sql,'Build 318 SQL missing '+token)
for token in ('build300','build306','build312','ADOPTION_STABLE_DISCOVERY_AND_NEXT_STORY_EVIDENCE_GAPS_REMAIN','roadmap_signal','automatic_story_generation:false','production_d1_contact:false'):q(token in verify,'Build 318 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','ROADMAP RENEWAL: OBSERVED EVIDENCE ONLY','BUSINESS DATA MUTATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 318 workflow boundary missing '+token)
q(int(p.get('build') or 0)>=318,'Current pointer must retain Build 318 or successor')
print('RELEASE 467 BUILD 318 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL III')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Roadmap renewal is evidence-driven and measurement-first')
