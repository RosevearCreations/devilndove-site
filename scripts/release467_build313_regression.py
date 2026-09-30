#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build313-second-maker-story-review-decision-completeness.json')
prev=j('release467-build312-content-adoption-coverage-outcomes-renewal-ii-roadmap-renewal.json')
p=j('current-development-authority.json')
disc=t('scripts/release467_build313_discovery.sql')
apply=t('scripts/release467_build313_apply_review_decision.sql')
wf=t('.github/workflows/release467-build313-second-maker-story-review-decision-completeness.yml')
road=t('docs/operations/RELEASE_467_REVIEWED_STORY_DISCOVERY_ADOPTION_BUILDS_313_318.md')
q(a.get('build')==313 and a.get('title')=='Second Maker Story Review Decision & Completeness','Build 313 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 312 final closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='0045b29b0635d91f1c6d03b784c841b19fffc763','Build 312 exact Development closure missing')
q((prev.get('final_closure') or {}).get('tree_sha')=='391c869e0587fe2f865d85af781a06296f07ef8d','Build 312 exact tree missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='c5e7bb72ec990118057d6955223e60ddaf691eac','Build 312 Production checkpoint missing')
d=a.get('decision_contract') or {}
q(d.get('explicit_review_decision')=='REMAIN_NEEDS_REVIEW_PENDING_EXECUTION_RESULT_LESSON_EVIDENCE','Build 313 explicit review decision mismatch')
q(d.get('story_review_status')=='needs_review' and d.get('public_story_candidate')==0,'Build 313 fail-closed story state mismatch')
q(d.get('media_rights_scope')=='separate_never_inferred' and d.get('approved_copy_does_not_authorize_publication') is True,'Build 313 rights/publication boundary mismatch')
for token in ('non_planning_events','selected_execution_evidence','approved_locked_copy','creative_project_maker_story_profiles','content_publications','social_post_queue'):
    q(token in disc,'Build 313 discovery missing '+token)
upper=' '+re.sub(r'--.*','',disc).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 313 discovery must remain read-only: '+forbidden.strip())
for token in ("story_review_status='needs_review'","public_story_candidate=0","maker_story_review_decision_build","REMAIN_NEEDS_REVIEW_PENDING_EXECUTION_RESULT_LESSON_EVIDENCE","separate_never_inferred","maker_story_approved_copy_authorizes_publication"):
    q(token in apply,'Build 313 review decision SQL missing '+token)
for forbidden in ('INSERT INTO content_publications','INSERT INTO social_post_queue','UPDATE content_publications','UPDATE social_post_queue','UPDATE creative_work_events','UPDATE creative_project_evidence_selections'):
    q(forbidden not in apply,'Build 313 unauthorized downstream mutation token: '+forbidden)
for token in ('DEVELOPMENT D1 MUTATION: BOUNDED REVIEW DECISION TRACEABILITY ONLY','PUBLICATION MUTATION: ZERO','SOCIAL MUTATION: ZERO','MEDIA RIGHTS INFERENCE: ZERO','PRODUCTION D1 CONTACT: ZERO'):
    q(token in wf,'Build 313 workflow boundary missing '+token)
q('Build 314 — Second Story Publication Readiness & Review-Queue Continuity' in road,'Build 314 successor roadmap missing')
q(int(p.get('build') or 0)>=313,'Current pointer must retain Build 313 or successor')
if int(p.get('build') or 0)==313:q(int(p.get('next_build') or 0)==314,'Build 314 successor pointer missing')
print('RELEASE 467 BUILD 313 SECOND MAKER STORY REVIEW DECISION & COMPLETENESS')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Decision: REMAIN NEEDS_REVIEW / PUBLIC CANDIDATE 0')
print('Next: Build 314 — Second Story Publication Readiness & Review-Queue Continuity')
