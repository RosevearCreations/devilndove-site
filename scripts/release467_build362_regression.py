#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build362-35th-promo-factual-evidence-completion-continuity-vii.json')
prev=j('release467-build361-evidence-gap-execution-workbench-input-completion-continuity-vi.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build362_measurement.sql')
verify=t('scripts/release467_build362_verify_measurement.mjs')
wf=t('.github/workflows/release467-build362-35th-promo-factual-evidence-completion-continuity-vii.yml')
page=t('admin/creative-process/index.html')
ui=t('public/js/admin-creative-process.js')
api=t('functions/api/admin/35th-promo-outcome-closure.js')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_361_366.md')

q(a.get('build')==362 and a.get('title')=='35th Promo Factual Evidence Completion Continuity VII','Build 362 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 361 Production closure not successor-ingested')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='3ff87de9bf8a91f1764778498ad4c7b2d28d1c57' and fc.get('tree_sha')=='ff5988551b77c67ea72ebefd2d8d2b99aa014d82','Build 361 exact Development closure missing')
q(pc.get('main_sha')=='ac4f29f4cbeca4036b9f6ae57d7e0a563d6d8696' and pc.get('tree_sha')=='ff5988551b77c67ea72ebefd2d8d2b99aa014d82' and pc.get('state')=='PRODUCTION_GREEN','Build 361 Production checkpoint missing')

c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('source_workbench_build')==361 and c.get('reuses_operator_action')=='record_story_execution_evidence','Build 362 source-workbench/factual intake contract mismatch')
q(c.get('readiness_only') is True and c.get('explicit_human_review_required') is True and c.get('automatic_story_review') is False and c.get('automatic_public_candidate') is False and c.get('automatic_publication') is False,'Build 362 review-first boundary mismatch')
q(c.get('placeholder_absence_text_does_not_satisfy_readiness') is True,'Build 362 placeholder guard missing')
q(all(v is False for v in s.values()),'Build 362 safety drift')

upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 362 measurement must remain read-only: '+forbidden.strip())
for token in ('execution_events','result_events','lesson_events','actual_result','lesson_learned','execution_rows_with_public_or_media_flags','pragma_foreign_key_check'):q(token in sql,'Build 362 measurement missing '+token)
for token in ('REAL_OUTCOME_EVIDENCE_STILL_REQUIRED','REAL_OUTCOME_EVIDENCE_PARTIAL','REAL_EVENTS_COMPLETE_MAKER_STORY_FACTS_STILL_REQUIRED','REAL_OUTCOME_FACTS_COMPLETE_READY_FOR_EXPLICIT_HUMAN_REVIEW','comparison_to_build361','placeholderGuard','substantiveFact','automatic_story_review:false','production_d1_contact:false'):q(token in verify,'Build 362 verifier missing '+token)

for token in ("const BUILD=362","title:'35th Promo Factual Evidence Completion Continuity VII'","placeholderGuard","substantiveFact","explicit_human_review_only"):q(token in api,'Build 362 closure API missing '+token)
q('onRequestPost' not in api,'Build 362 closure endpoint must remain GET-only')
q('data-build362-factual-evidence-continuity' in page and '/public/js/admin-creative-process.js?v=467b362' in page,'Build 362 Creative Process marker/cache missing')
q('BUILD362_CURRENT_CLIENT' in ui and 'BUILD362_CURRENT_API_IDENTITY' in api,'Build 362 UI/API identity missing')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SYNTHETIC EVIDENCE: ZERO','AUTOMATIC STORY REVIEW: ZERO','PUBLIC CANDIDACY MUTATION: ZERO','PUBLICATION/SOCIAL MUTATION: ZERO','MEDIA RIGHTS INFERENCE: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 362 workflow boundary missing '+token)
q('Build 362 — 35th Promo Factual Evidence Completion Continuity VII' in road and 'Build 363 — Grey Hair Source Review & Story-Plan Completion Continuity VII' in road,'Build 362/363 roadmap continuity missing')

cur=int(p.get('build') or 0);q(cur>=362,'Current pointer must retain Build 362 or successor')
if cur==362:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==363,'Build 362 current authority/successor mismatch')
for path in ('scripts/release467_build362_verify_measurement.mjs','functions/api/admin/35th-promo-outcome-closure.js','public/js/admin-creative-process.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout)[-1400:])

print('RELEASE 467 BUILD 362 35TH PROMO FACTUAL EVIDENCE COMPLETION CONTINUITY VII')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Real factual completeness can only produce explicit human-review readiness.')
