#!/usr/bin/env python3
"""Build 371: exact predecessor, read-only measurement, and human approval safety."""
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1]
def t(path):return (R/path).read_text(encoding='utf-8')
def j(path):return json.loads(t(path))
def need(cond,msg):
    if not cond:raise SystemExit("BUILD371_REGRESSION_FAILED: "+msg)
a=j('release467-build371-maker-story-advancement-publication-readiness-continuity-ix.json')
prev=j('release467-build370-search-console-real-export-fresh-discovery-intake-x.json')
pointer=j('current-development-authority.json')
sql=t('scripts/release467_build371_continuity.sql')
ver=t('scripts/release467_build371_verify_continuity.mjs')
wf=t('.github/workflows/release467-build371-maker-story-advancement-publication-readiness-continuity-ix.yml')
old=t('.github/workflows/release467-build370-search-console-real-export-fresh-discovery-intake-x.yml')
need(a['release']==467 and a['build']==371 and a['title']=='Maker Story Advancement & Publication Readiness Continuity IX','identity')
need(prev['state']=='PRODUCTION_GREEN' and prev['final_closure']['dev_sha']=='b37a7c9fd67389bc55c035ca62155f0f122403a1' and prev['final_closure']['tree_sha']=='a4a81a25ebf48686aff025f79024dae6d3736b84','Build 370 verified development')
need(prev['production_checkpoint']['main_sha']=='a5da1ed88b79aade14fdd6ccae6dad8586d36a8e' and prev['production_checkpoint']['tree_sha']=='a4a81a25ebf48686aff025f79024dae6d3736b84','Build 370 verified production')
need(a['predecessor']['development_sha']=='b37a7c9fd67389bc55c035ca62155f0f122403a1' and a['predecessor']['production_tree_sha']=='a4a81a25ebf48686aff025f79024dae6d3736b84','predecessor reference')
need(all(value is False for value in a['safety'].values()),'mutation safety')
c=a['contract']
for field in ('factual_evidence_required','explicit_story_review_required','public_story_candidate_required','approved_content_copy_required','locked_content_copy_required','published_story_requires_human_publication_traceability','public_media_rights_separate_from_story_text_readiness','private_media_never_public_by_inference','publication_readiness_is_read_only_classification','provider_posting_independent','promo35_real_execution_result_lesson_events_required'):
    need(c[field] is True,field)
need(c['expected_active_projects']==5 and c['coverage_population']=='ALL_ACTIVE_CREATIVE_PROJECTS','project coverage')
need(a['next_build']==372 and pointer['build']>=371,'active successor')
normalized=' '+re.sub(r'--[^\n]*','',sql).upper()+' '
for statement in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    need(statement not in normalized,'SQL not read only: '+statement)
for name in ('actual_result','lesson_learned','human_published_journal_rows','public_allowed_caip_assets','public_allowed_private_uploads','execution_events','result_events','lesson_events','pragma_foreign_key_check'):
    need(name in sql,'SQL missing '+name)
for name in ('placeholderGuard','FACTUAL_OUTCOME_EVIDENCE_REQUIRED','PUBLISHED_REVIEWED_STORY','PUBLICATION_REVIEW_READY','publication_mutation:false','provider_execution:false','production_d1_contact:false'):
    need(name in ver,'verifier missing '+name)
need('D1_ONE_SHOT_EVIDENCE_CAPTURE' in wf and 'PRODUCTION D1 CONTACT: ZERO' in wf and 'AUTOMATIC PUBLICATION: ZERO' in wf,'workflow boundaries')
need(('branches: [dev]' in wf if pointer['build']==371 else 'branches: [dev]' not in wf) and 'workflow_dispatch:' in wf,'build workflow triggers')
need('branches: [dev]' not in old and 'workflow_dispatch:' in old,'Build 370 workflow must be manual-only')
need('makerStoryCoverageBuild329Mount' in t('admin/maker-story-coverage/index.html'),'canonical workspace')
need('automatic_publication:false' in t('functions/api/admin/maker-story-coverage.js'),'existing review-first API')
print('RELEASE467_BUILD371_REGRESSION=GREEN')
