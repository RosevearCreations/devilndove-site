from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1]
def q(v,m):
    if not v: raise SystemExit(m)
def j(p): return json.loads((R/p).read_text(encoding='utf-8'))
def t(p): return (R/p).read_text(encoding='utf-8')
a=j('release467-build365-maker-story-advancement-publication-readiness-continuity-viii.json');prev=j('release467-build364-search-console-real-export-fresh-discovery-intake-ix.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build365_continuity.sql');verify=t('scripts/release467_build365_verify_continuity.mjs');wf=t('.github/workflows/release467-build365-maker-story-advancement-publication-readiness-continuity-viii.yml')
api=t('functions/api/admin/maker-story-coverage.js');page=t('admin/maker-story-coverage/index.html');ui=t('public/js/admin-maker-story-coverage-v329.js')
rel=t('functions/api/_lib/currentReliability.js');pre=t('functions/api/admin/current-deployment-preflight.js');it=t('functions/api/admin/it-operations-control-tower.js')
q(a.get('build')==365 and a.get('title')=='Maker Story Advancement & Publication Readiness Continuity VIII','Build 365 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CLOSURE_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 365 authority state mismatch')
q((prev.get('final_closure') or {}).get('dev_sha')=='94e61e0d2c37adce25857f41748ba28e9ff34378' and (prev.get('final_closure') or {}).get('tree_sha')=='db31cdf65544972babe34b2b1c57a24274fa7889','Build 364 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='1ef40e8926042335846372c072cdd5c000317dfd' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='db31cdf65544972babe34b2b1c57a24274fa7889','Build 364 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('reuses_build359_maker_story_measurement') is True and c.get('reuses_build364_search_console_real_only_boundary') is True,'Build 365 retained authority mismatch')
q(c.get('expected_active_projects')==5 and c.get('coverage_population')=='ALL_ACTIVE_CREATIVE_PROJECTS','Build 365 five-project coverage mismatch')
q(c.get('substantive_non_placeholder_result_and_lesson_required') is True and c.get('promo35_real_execution_result_lesson_events_required') is True,'Build 365 factual evidence guard mismatch')
q(c.get('explicit_story_review_required') is True and c.get('public_story_candidate_required') is True and c.get('approved_content_copy_required') is True and c.get('locked_content_copy_required') is True,'Build 365 review/copy readiness mismatch')
q(c.get('public_media_rights_separate_from_story_text_readiness') is True and c.get('private_media_never_public_by_inference') is True and c.get('provider_posting_independent') is True,'Build 365 rights/provider boundary mismatch')
q(all(v is False for v in s.values()),'Build 365 safety authority drift')
upper=' '+re.sub(r'\s+',' ',sql.upper())+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '): q(forbidden not in upper,'Build 365 measurement must remain read-only: '+forbidden.strip())
for token in ('what_we_are_trying','actual_result','lesson_learned','execution_events','result_events','lesson_events','source_evidence_needs_review','human_published_journal_rows','provider_posted_rows','pragma_foreign_key_check'): q(token in sql,'Build 365 SQL missing '+token)
for token in ('placeholderGuard','PUBLISHED_REVIEWED_STORY','FACTUAL_OUTCOME_EVIDENCE_REQUIRED','PUBLICATION_REVIEW_READY','publication_mutation:false','production_d1_contact:false'): q(token in verify,'Build 365 verifier missing '+token)
for token in ('makerStoryCoverageBuild329Mount','admin-maker-story-coverage-v329.js'): q(token in page,'Maker Story coverage workspace authority missing')
q('automatic_publication:false' in api and 'provider_execution:false' in api,'Maker Story API review-first boundary missing')
current=int(p.get('build') or 0)
triggers=('push:','branches: [dev]') if current==365 else ('workflow_dispatch:',)
for token in (*triggers,'D1_ONE_SHOT_EVIDENCE_CAPTURE','FIVE ACTIVE PROJECTS: READ-ONLY ADVANCEMENT','AUTOMATIC PUBLICATION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'): q(token in wf,'Build 365 workflow boundary missing '+token)
q(current>=365,'Current pointer must retain Build 365 or successor')
if current==365:
    q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==366 and str(p.get('promotion_state') or '').endswith('_CANDIDATE_NOT_YET_VERIFIED'),'Build 365 current pointer governance mismatch')
for text,name in ((rel,'Reliability'),(pre,'Preflight'),(it,'I.T.')):
    q('365' in text and 'Maker Story Advancement & Publication Readiness Continuity VIII' in text,name+' current Build 365 identity missing')
print('RELEASE467_BUILD365_REGRESSION=GREEN')
