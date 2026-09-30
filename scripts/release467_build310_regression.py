#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build310-review-first-publication-distribution-continuity.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build310_continuity_discovery.sql')
verify=t('scripts/release467_build310_verify_continuity.mjs')
wf=t('.github/workflows/release467-build310-review-first-publication-distribution-continuity.yml')
fn=t('functions/api/_lib/contentPublications.js');root=t('_lib/contentPublications.js')
road=t('docs/operations/RELEASE_467_CONTENT_ADOPTION_COVERAGE_DISCOVERY_BUILDS_307_312.md')
q(a.get('build')==310 and a.get('title')=='Review-First Publication & Distribution Continuity','Build 310 identity mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='6c432524d8fad7eea5eabbd85f4f4a80e7aa1ec0' and pred.get('development_tree_sha')=='9216756424a22feb66e6f0b69047ab340496a240','Build 309 Development predecessor mismatch')
q(pred.get('production_main_sha')=='a65463ee79a50ec16741958bc2913cf67b198966' and pred.get('production_tree_sha')=='9216756424a22feb66e6f0b69047ab340496a240','Build 309 Production predecessor mismatch')
q(pred.get('production_pages_deploy_run')==36668510235 and pred.get('production_live_resource_integrity_run')==36668575436,'Build 309 Production proof mismatch')
c=a.get('contract') or {}
q(c.get('existing_maker_story_profile_requires_explicit_publication_review') is True and c.get('observed_story_review_status')=='needs_review' and c.get('observed_public_story_candidate')==0,'Build 310 review-first prerequisite mismatch')
q(c.get('second_story_publication_action')=='BLOCKED_UNTIL_EXPLICIT_MAKER_STORY_REVIEW' and c.get('provider_execution') is False,'Build 310 fail-closed publication contract mismatch')
for body in (fn,root):
    q('makerStoryPublicationPrerequisite' in body,'Build 310 Maker Story publication prerequisite helper missing')
    q('content_project_source_type' in body and 'content_project_source_id' in body,'Build 310 publication source identity missing')
    q('Cannot approve this public draft until the Maker Story is explicitly reviewed and marked as a public story candidate.' in body,'Build 310 approval fail-closed message missing')
    q('Cannot publish this public draft until the Maker Story is explicitly reviewed and marked as a public story candidate.' in body,'Build 310 publish fail-closed message missing')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 310 continuity SQL must remain read-only: '+forbidden.strip())
for token in ("content_project_id=23","story_review_status","public_story_candidate","workshop-journal-22-under-the-sea","pragma_foreign_key_check"):q(token in sql,'Build 310 continuity SQL missing '+token)
for token in ('BUILD310_REVIEW_FIRST_PUBLICATION_CONTINUITY=GREEN','BLOCKED_UNTIL_EXPLICIT_MAKER_STORY_REVIEW','production_d1_contact:false'):q(token in verify,'Build 310 verifier missing '+token)
for token in ('D1_READ_ONLY_EVIDENCE_CAPTURE','DEVELOPMENT D1 MUTATION: ZERO','SECOND STORY PUBLICATION: BLOCKED UNTIL EXPLICIT MAKER STORY REVIEW','SOCIAL PROVIDER EXECUTION: ZERO','INDEXNOW EXECUTION: ZERO','MARKETPLACE EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 310 workflow boundary missing '+token)
q('Build 310 — Review-First Publication & Distribution Continuity' in road and 'Build 311 — Buyer Discovery Evidence Freshness & Search Intake' in road,'Build 310/311 canonical roadmap scope missing')
cur=int(p.get('build') or 0);q(cur>=310,'Current pointer must retain Build 310 or successor')
if cur==310:q(int(p.get('next_build') or 0)==311 and p.get('next_build_title')=='Buyer Discovery Evidence Freshness & Search Intake','Build 311 successor pointer missing')
print('RELEASE 467 BUILD 310 REVIEW-FIRST PUBLICATION & DISTRIBUTION CONTINUITY')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Second story remains fail-closed until explicit Maker Story review/public-candidate approval')
print('Next: Build 311 — Buyer Discovery Evidence Freshness & Search Intake')
