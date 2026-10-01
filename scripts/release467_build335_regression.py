#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build335-maker-story-advancement-publication-readiness-continuity-iii.json')
prev=j('release467-build334-search-console-real-export-fresh-discovery-intake-iv.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build335_continuity.sql')
verify=t('scripts/release467_build335_verify_continuity.mjs')
wf=t('.github/workflows/release467-build335-maker-story-advancement-publication-readiness-continuity-iii.yml')
api=t('functions/api/admin/maker-story-coverage.js')
page=t('admin/maker-story-coverage/index.html')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_331_336.md')
q(a.get('build')==335 and a.get('title')=='Maker Story Advancement & Publication Readiness Continuity III','Build 335 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 334 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='e18b37a22fb5e4f0e58e8d5e240d922c499fabec' and (prev.get('final_closure') or {}).get('tree_sha')=='192445094dd80dd19570b86ad989cfffea1d4fdf','Build 334 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='2840cdc2ee09a2a585ec003e5f57bdc0c08cbc6c' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='192445094dd80dd19570b86ad989cfffea1d4fdf','Build 334 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_build329_maker_story_authorities') is True,'Build 335 must reuse Build 329 Maker Story authorities')
q(c.get('expected_active_projects')==5 and c.get('coverage_population')=='ALL_ACTIVE_CREATIVE_PROJECTS','Build 335 five-project coverage contract mismatch')
q(c.get('substantive_non_placeholder_result_and_lesson_required') is True and c.get('promo35_real_execution_result_lesson_events_required') is True,'Build 335 factual evidence guard mismatch')
q(c.get('explicit_story_review_required') is True and c.get('public_story_candidate_required') is True and c.get('approved_content_copy_required') is True and c.get('locked_content_copy_required') is True,'Build 335 review/copy readiness contract mismatch')
q(c.get('public_media_rights_separate_from_story_text_readiness') is True and c.get('private_media_never_public_by_inference') is True and c.get('provider_posting_independent') is True,'Build 335 rights/provider boundary mismatch')
q(all(v is False for v in s.values()),'Build 335 safety authority drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 335 measurement must remain read-only: '+forbidden.strip())
for token in ('what_we_are_trying','actual_result','lesson_learned','execution_events','result_events','lesson_events','source_evidence_needs_review','human_published_journal_rows','provider_posted_rows','pragma_foreign_key_check'):q(token in sql,'Build 335 SQL missing '+token)
for token in ('placeholderGuard','substantiveFact','PUBLISHED_REVIEWED_STORY','FACTUAL_OUTCOME_EVIDENCE_REQUIRED','PUBLICATION_REVIEW_READY','promo35_real_execution_result_lesson_events_required:true','publication_mutation:false','production_d1_contact:false'):q(token in verify,'Build 335 verifier missing '+token)
q('onRequestPost' not in api,'Maker Story coverage API must remain GET-only')
q('makerStoryCoverageBuild329Mount' in page and 'admin-maker-story-coverage-v329.js' in page,'Existing Maker Story coverage workspace must remain the reused authority')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','FIVE ACTIVE PROJECTS: READ-ONLY ADVANCEMENT','SUBSTANTIVE RESULT/LESSON FACTS: REQUIRED','HUMAN STORY REVIEW: REQUIRED','MEDIA RIGHTS: SEPARATE NEVER INFERRED','AUTOMATIC PUBLICATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 335 workflow boundary missing '+token)
q('Build 336 — Content Adoption & Discovery Outcomes Renewal VI' in road,'Build 336 successor roadmap missing')
q(int(p.get('build') or 0)>=335,'Current pointer must retain Build 335 or successor')
if int(p.get('build') or 0)==335:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==336,'Build 335 current authority/successor mismatch')
print('RELEASE 467 BUILD 335 MAKER STORY ADVANCEMENT & PUBLICATION READINESS CONTINUITY III')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Readiness remains factual, human-reviewed, rights-separated and mutation-free')
print('Next: Build 336 — Content Adoption & Discovery Outcomes Renewal VI')
