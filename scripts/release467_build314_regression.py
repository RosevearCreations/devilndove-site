#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build314-second-story-publication-readiness-review-queue-continuity.json')
prev=j('release467-build313-second-maker-story-review-decision-completeness.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build314_readiness_discovery.sql')
verify=t('scripts/release467_build314_verify_readiness.mjs')
wf=t('.github/workflows/release467-build314-second-story-publication-readiness-review-queue-continuity.yml')
road=t('docs/operations/RELEASE_467_REVIEWED_STORY_DISCOVERY_ADOPTION_BUILDS_313_318.md')
q(a.get('build')==314 and a.get('title')=='Second Story Publication Readiness & Review-Queue Continuity','Build 314 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 313 final Production closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='6d62f2b7f8876715d3dc6a9afa2da9b1999979a3','Build 313 exact Development closure missing')
q((prev.get('final_closure') or {}).get('tree_sha')=='323d985b6385ee103552a51723b087187010ab53','Build 313 exact tree missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='14375bce8e1749b309e60ef3baf1804ee01bdc47','Build 313 Production checkpoint missing')
c=a.get('readiness_contract') or {}
q(c.get('publication_readiness')=='BLOCKED' and c.get('workshop_journal_action')=='NO_PUBLICATION_CREATED' and c.get('social_review_queue_action')=='NO_SOCIAL_ROW_CREATED','Build 314 fail-closed readiness mismatch')
q(c.get('approved_copy_alone_authorizes_publication') is False and c.get('media_rights_scope')=='SEPARATE_NEVER_INFERRED','Build 314 rights/publication boundary mismatch')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 314 discovery must remain read-only: '+forbidden.strip())
for token in ('review_decision_build','selected_execution_evidence','approved_locked_deliverables','changes_requested_deliverables','content_publications','social_post_queue','pragma_foreign_key_check'):q(token in sql,'Build 314 discovery missing '+token)
for token in ('BUILD314_SECOND_STORY_PUBLICATION_READINESS=BLOCKED_GREEN','publication_readiness:\'BLOCKED\'','publication_mutation:false','social_mutation:false','provider_execution:false','production_d1_contact:false'):q(token in verify,'Build 314 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','DEVELOPMENT D1 MUTATION: ZERO','SECOND STORY PUBLICATION: BLOCKED','SOCIAL REVIEW-QUEUE MUTATION: ZERO','PROVIDER EXECUTION: ZERO','MEDIA RIGHTS INFERENCE: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 314 workflow boundary missing '+token)
q('Build 315 — Search Console Operator Intake Acceptance' in road,'Build 315 successor roadmap missing')
q(int(p.get('build') or 0)>=314,'Current pointer must retain Build 314 or successor')
if int(p.get('build') or 0)==314:q(int(p.get('next_build') or 0)==315,'Build 315 successor pointer missing')
print('RELEASE 467 BUILD 314 SECOND STORY PUBLICATION READINESS & REVIEW-QUEUE CONTINUITY')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Publication readiness: BLOCKED — no second-story publication/social row created')
print('Next: Build 315 — Search Console Operator Intake Acceptance')
