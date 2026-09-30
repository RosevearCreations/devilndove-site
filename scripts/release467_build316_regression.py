#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build316-buyer-discovery-evidence-interpretation-seo-review-queue.json')
prev=j('release467-build315-search-console-operator-intake-acceptance.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/search-console-import.js')
measure=t('functions/api/admin/buyer-discovery-measurement.js')
ui=t('public/js/admin-search-console-import.js')
buyerui=t('public/js/admin-buyer-discovery-measurement.js')
sql=t('scripts/release467_build316_interpretation.sql')
verify=t('scripts/release467_build316_verify_interpretation.mjs')
wf=t('.github/workflows/release467-build316-buyer-discovery-evidence-interpretation-seo-review-queue.yml')
road=t('docs/operations/RELEASE_467_REVIEWED_STORY_DISCOVERY_ADOPTION_BUILDS_313_318.md')
q(a.get('build')==316 and a.get('title')=='Buyer Discovery Evidence Interpretation & SEO Review Queue','Build 316 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 315 Production closure not successor-ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='2a7c1aa8d90b4851073f50d67b87d5e199ea303d' and (prev.get('final_closure') or {}).get('tree_sha')=='4f1816b0700157ac1c71d170d08a0116af19eac4','Build 315 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='7c8605c627c25443df24d08b5ffecb3fa315c084','Build 315 Production checkpoint missing')
c=a.get('contract') or {};s=a.get('safety') or {}
q(c.get('queue_semantics')=='EVIDENCE_BACKED_HUMAN_REVIEW_ONLY' and c.get('search_console_required_for_query_level_seo_actions') is True,'Build 316 queue evidence policy mismatch')
q(c.get('generated_title') is False and c.get('generated_meta_description') is False and c.get('generated_internal_link') is False and c.get('explicit_human_copy_required_before_apply') is True,'Build 316 no-generated-copy policy mismatch')
q(all(v is False for v in s.values()),'Build 316 safety authority drift')
for token in ('Evidence-backed review queue','suggested_title,suggested_meta_description,suggested_internal_link_note','null,null,null','Current Search Console evidence no longer supports','Enter reviewed SEO copy explicitly'):
    q(token in api,'Build 316 Search Console API missing '+token)
q('titleCase(' not in api and 'const suggestedTitle' not in api and 'const suggestedMeta' not in api and 'const internalNote' not in api,'Build 316 must not generate SEO wording')
for token in ('Queue evidence-backed reviews','Evidence-backed review','manual SEO wording','current evidence'):
    q(token in ui,'Build 316 Search Console UI missing '+token)
for token in ('build:316','Buyer Discovery Evidence Interpretation & SEO Review Queue','seo_review_queue','query_level_action_state','public_telemetry_observation_only'):
    q(token in measure,'Build 316 buyer measurement API missing '+token)
for token in ('Build 316 • evidence interpretation','SEO review queue','query-level SEO action','No query-level SEO action'):
    q(token in buyerui,'Build 316 buyer measurement UI missing '+token)
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 316 measurement must remain read-only: '+forbidden.strip())
for token in ('eligible_pairs','currently_supported_rows','unsupported_pending_rows','legacy_generated_copy_rows','page_views_30d','orphan_search_rows'):q(token in sql,'Build 316 SQL missing '+token)
for token in ('EVIDENCE_PENDING_NO_SEARCH_QUERY_DATA','REAL_EVIDENCE_NO_SUPPORTED_SEO_OPPORTUNITY','REAL_EVIDENCE_REVIEW_QUEUE_ELIGIBLE','generated_seo_copy:false','queue_mutation:false','production_d1_contact:false'):q(token in verify,'Build 316 verifier missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','SEO REVIEW QUEUE CI MUTATION: ZERO','GENERATED SEO COPY: ZERO','SYNTHETIC DISCOVERY ROWS: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 316 workflow boundary missing '+token)
q('Build 317 — Third Project Maker Story Readiness & Evidence Selection' in road,'Build 317 successor roadmap missing')
q(int(p.get('build') or 0)>=316,'Current pointer must retain Build 316 or successor')
if int(p.get('build') or 0)==316:q(int(p.get('next_build') or 0)==317,'Build 317 successor pointer missing')
print('RELEASE 467 BUILD 316 BUYER DISCOVERY EVIDENCE INTERPRETATION & SEO REVIEW QUEUE')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('SEO queue: real query/impression evidence only; no generated copy')
print('Next: Build 317 — Third Project Maker Story Readiness & Evidence Selection')
