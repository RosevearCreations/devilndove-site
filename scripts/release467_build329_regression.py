#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build329-maker-story-advancement-publication-readiness-continuity-ii.json');prev=j('release467-build328-search-console-real-export-freshness-discovery-intake-iii.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build329_continuity.sql');verify=t('scripts/release467_build329_verify_continuity.mjs');wf=t('.github/workflows/release467-build329-maker-story-advancement-publication-readiness-continuity-ii.yml');api=t('functions/api/admin/maker-story-coverage.js');page=t('admin/maker-story-coverage/index.html');ui=t('public/js/admin-maker-story-coverage-v329.js');road=t('docs/operations/RELEASE_467_EVIDENCE_ACTION_ADOPTION_BUILDS_325_330.md')
q(a.get('build')==329 and a.get('title')=='Maker Story Advancement & Publication Readiness Continuity II','Build 329 identity mismatch');q(prev.get('state')=='PRODUCTION_GREEN','Build 328 Production closure not successor-ingested');q((prev.get('final_closure') or {}).get('dev_sha')=='d6bf534016c85e4fa295aa6fbdaa12efb4659647' and (prev.get('final_closure') or {}).get('tree_sha')=='3f456f3d9cd2cde9ecf809c4530a0a46bbd45e4e','Build 328 exact Development closure missing');q((prev.get('production_checkpoint') or {}).get('main_sha')=='13210bde05ea77607095f532681d78024758bd23' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='3f456f3d9cd2cde9ecf809c4530a0a46bbd45e4e','Build 328 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {};q(c.get('expected_active_projects')==5 and c.get('coverage_population')=='ALL_ACTIVE_CREATIVE_PROJECTS','Build 329 five-project coverage contract mismatch');q(c.get('substantive_non_placeholder_result_and_lesson_required') is True and c.get('promo35_real_execution_result_lesson_events_required') is True,'Build 329 factual evidence guard mismatch');q(c.get('explicit_story_review_required') is True and c.get('public_story_candidate_required') is True and c.get('approved_content_copy_required') is True and c.get('locked_content_copy_required') is True,'Build 329 review/copy readiness contract mismatch');q(c.get('public_media_rights_separate_from_story_text_readiness') is True and c.get('private_media_never_public_by_inference') is True and c.get('provider_posting_independent') is True,'Build 329 rights/provider boundary mismatch');q(all(v is False for v in s.values()),'Build 329 safety authority drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 329 measurement must remain read-only: '+forbidden.strip())
for token in ('what_we_are_trying','actual_result','lesson_learned','execution_events','result_events','lesson_events','source_evidence_needs_review','human_published_journal_rows','provider_posted_rows','pragma_foreign_key_check'):q(token in sql,'Build 329 SQL missing '+token)
for token in ('placeholderGuard','substantiveFact','PUBLISHED_REVIEWED_STORY','FACTUAL_OUTCOME_EVIDENCE_REQUIRED','PUBLICATION_REVIEW_READY','promo35_real_execution_result_lesson_events_required:true','publication_mutation:false','production_d1_contact:false'):q(token in verify,'Build 329 verifier missing '+token)
for token in ('placeholderGuard','substantiveFact','build:BUILD','substantive_non_placeholder_result_and_lesson_required:true','publication_readiness_is_read_only_classification:true','public_media_rights_separate:true','automatic_publication:false','provider_execution:false'):q(token in api,'Build 329 API missing '+token)
q('onRequestPost' not in api,'Build 329 coverage API must remain GET-only')
for token in ('Release 467 • Build 329','Maker Story Advancement &amp; Publication Readiness Continuity II','makerStoryCoverageBuild329Mount','admin-maker-story-coverage-v329.js'):q(token in page,'Build 329 page missing '+token)
for token in ('Build 329 • read-only advancement continuity','Placeholder absence text never counts','Media rights — separate','never auto-creates a Maker Story','provider posting remains independent'):q(token in ui,'Build 329 UI missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','FIVE ACTIVE PROJECTS: READ-ONLY ADVANCEMENT','SUBSTANTIVE RESULT/LESSON FACTS: REQUIRED','HUMAN STORY REVIEW: REQUIRED','MEDIA RIGHTS: SEPARATE NEVER INFERRED','AUTOMATIC PUBLICATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 329 workflow boundary missing '+token)
q('Build 330 — Content Adoption & Discovery Outcomes Renewal V' in road,'Build 330 successor roadmap missing');q(int(p.get('build') or 0)>=329,'Current pointer must retain Build 329 or successor')
if int(p.get('build') or 0)==329:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==330,'Build 329 current authority/successor mismatch')
print('RELEASE 467 BUILD 329 MAKER STORY ADVANCEMENT & PUBLICATION READINESS CONTINUITY II')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Next: Build 330 — Content Adoption & Discovery Outcomes Renewal V')
