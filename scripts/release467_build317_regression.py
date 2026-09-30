#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build317-third-project-maker-story-readiness-evidence-selection.json')
prev=j('release467-build316-buyer-discovery-evidence-interpretation-seo-review-queue.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build317_discovery.sql')
verify=t('scripts/release467_build317_verify_discovery.mjs')
wf=t('.github/workflows/release467-build317-third-project-maker-story-readiness-evidence-selection.yml')
road=t('docs/operations/RELEASE_467_REVIEWED_STORY_DISCOVERY_ADOPTION_BUILDS_313_318.md')
q(a.get('build')==317 and a.get('title')=='Third Project Maker Story Readiness & Evidence Selection','Build 317 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 316 Production closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='d4511f2539b03e35e0989716065888c42b008fb1' and (prev.get('final_closure') or {}).get('tree_sha')=='f89d348018b48ddcb9adad0229e745913051a168','Build 316 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='ed9a89f070ecd05fcd3024df9b2ba4ddcbb7b33e','Build 316 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('max_selected_projects')==1 and c.get('metadata_alone_sufficient') is False,'Build 317 selection policy mismatch')
q(c.get('exact_one_caip_workspace_required') is True and c.get('exact_one_content_package_required') is True,'Build 317 identity policy mismatch')
q(c.get('public_media_rights_separate') is True and c.get('private_media_never_promoted_by_inference') is True,'Build 317 media-rights boundary mismatch')
q(all(v is False for v in s.values()),'Build 317 safety authority drift')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 317 discovery must remain read-only: '+forbidden.strip())
for token in ('execution_result_events','approved_source_evidence','reviewed_story_plans','source_backed_story_items','public_allowed_assets','public_allowed_uploads','duplicate_caip_source_identities','duplicate_content_source_identities','foreign_key_violations'):q(token in sql,'Build 317 discovery missing '+token)
for token in ('ONE_REAL_THIRD_PROJECT_READY','NO_THIRD_PROJECT_FACTUALLY_READY','selection_count:selected?1:0','metadata alone is insufficient','private_media_promoted:false','production_d1_contact:false'):q(token in verify,'Build 317 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','MAKER STORY PROFILE MUTATION: ZERO','EVIDENCE SELECTION MUTATION: ZERO','PUBLIC MEDIA RIGHTS INFERENCE: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 317 workflow boundary missing '+token)
q('Build 318 — Content Adoption & Discovery Outcomes Renewal III' in road,'Build 318 successor roadmap missing')
q(int(p.get('build') or 0)>=317,'Current pointer must retain Build 317 or successor')
if int(p.get('build') or 0)==317:q(int(p.get('next_build') or 0)==318,'Build 318 successor pointer missing')
print('RELEASE 467 BUILD 317 THIRD PROJECT MAKER STORY READINESS & EVIDENCE SELECTION')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Discovery is factual/read-only; at most one third project may qualify')
print('Next: Build 318 — Content Adoption & Discovery Outcomes Renewal III')
