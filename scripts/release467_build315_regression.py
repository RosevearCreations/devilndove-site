#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build315-search-console-operator-intake-acceptance.json')
prev=j('release467-build314-second-story-publication-readiness-review-queue-continuity.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/search-console-import.js');ui=t('public/js/admin-search-console-import.js')
sql=t('scripts/release467_build315_acceptance.sql');verify=t('scripts/release467_build315_verify_acceptance.mjs')
wf=t('.github/workflows/release467-build315-search-console-operator-intake-acceptance.yml')
road=t('docs/operations/RELEASE_467_REVIEWED_STORY_DISCOVERY_ADOPTION_BUILDS_313_318.md')
q(a.get('build')==315 and a.get('title')=='Search Console Operator Intake Acceptance','Build 315 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 314 final Production closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='59ca2152c7782b33e376b659d26e36e3388ebb05' and (prev.get('final_closure') or {}).get('tree_sha')=='9d31caa6f6a18bdac8236fe158d711f0e898b622','Build 314 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='8bea4144e1a50d43b85e94218ce7f878a6023904','Build 314 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('intake_mode')=='EXPLICIT_OPERATOR_CSV_ONLY' and c.get('no_real_export_state')=='EVIDENCE_PENDING_NO_REAL_EXPORT','Build 315 operator intake policy mismatch')
q(c.get('synthetic_rows_forbidden') is True and c.get('request_time_schema_repair') is False,'Build 315 factual/schema boundary mismatch')
q(all(v is False for v in s.values()),'Build 315 safety authority drift')
for token in ('operatorAcceptance','EVIDENCE_PENDING_NO_REAL_EXPORT','REAL_OPERATOR_EVIDENCE_PRESENT','search_console_import','search_console_delete_batch','request_time_schema_mutation:false'):
    q(token in api,'Build 315 Search Console API missing '+token)
for token in ('Operator intake:','Real Search Console evidence','safe batch revert','No real Search Console export is staged'):
    q(token in ui,'Build 315 Search Console UI missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 315 measurement must remain read-only: '+forbidden.strip())
for token in ('mismatched_batches','orphan_rows','operator_bound_batches','search_console_import','search_console_delete_batch','reviewed_story_rows','reviewed_product_rows','foreign_key_violations'):q(token in sql,'Build 315 SQL missing '+token)
for token in ('EVIDENCE_PENDING_NO_REAL_EXPORT','REAL_OPERATOR_EVIDENCE_ACCEPTED','synthetic_rows:false','automatic_import:false','production_d1_contact:false'):q(token in verify,'Build 315 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SEARCH CONSOLE AUTO IMPORT: ZERO','SYNTHETIC DISCOVERY ROWS: ZERO','REQUEST-TIME SCHEMA MUTATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 315 workflow boundary missing '+token)
q('Build 316 — Buyer Discovery Evidence Interpretation & SEO Review Queue' in road,'Build 316 successor roadmap missing')
q(int(p.get('build') or 0)>=315,'Current pointer must retain Build 315 or successor')
if int(p.get('build') or 0)==315:q(int(p.get('next_build') or 0)==316,'Build 316 successor pointer missing')
print('RELEASE 467 BUILD 315 SEARCH CONSOLE OPERATOR INTAKE ACCEPTANCE')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('No real export => evidence remains pending; real rows are never synthesized')
print('Next: Build 316 — Buyer Discovery Evidence Interpretation & SEO Review Queue')
