#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build304-workshop-journal-social-review-first-publication-acceptance.json')
prev=j('release467-build303-content-studio-draft-review-approval-adoption.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build304_accept_review_first_publication.sql')
wf=t('.github/workflows/release467-build304-workshop-journal-social-review-first-publication-acceptance.yml')
fn=t('functions/api/_lib/contentPublications.js');root=t('_lib/contentPublications.js')
q(a.get('build')==304 and a.get('title')=='Workshop Journal & Social Review-First Publication Acceptance','Build 304 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 303 final closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='2b260c9ff58ca56f75afe2f82144ba8f884d572e' and (prev.get('final_closure') or {}).get('tree_sha')=='d60f0f1812653cac9a85cd0f67730f4b7d2a587d','Build 303 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='5fe6e3b5c47f948d8e931fd7357801ca639cb7dd','Build 303 Production checkpoint missing')
for body in (fn,root):
    q("const mediaRequired = destination === 'website_gallery';" in body,'Build 304 text-only Journal media rule missing')
    q("Optional for a factual text-only Workshop Journal article." in body,'Build 304 optional Journal media explanation missing')
q("const mediaRequired = destination === 'website_gallery';" in fn and "const mediaRequired = destination === 'website_gallery';" in root,'Build 304 publication helper copies must both preserve the gallery-only media requirement')
for token in ("'content-project-22-workshop_journal'","'workshop_journal'","'published'","'workshop-journal-22-under-the-sea'","'approved','ready'","'review_first'","'[\"facebook\",\"x\"]'"):q(token in sql,'Build 304 acceptance SQL missing '+token)
for forbidden in ('devilndove-prod','bucket.put(','bucket.delete(','fetch('):q(forbidden.lower() not in sql.lower(),'Build 304 SQL crossed provider/Production boundary: '+forbidden)
q("destination='website_gallery'" in sql and 'website_gallery_rows' in sql,'Build 304 gallery boundary proof missing')
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','PRODUCTION D1 CONTACT: ZERO','PROVIDER EXECUTION: ZERO','PROVIDER PUBLICATION: ZERO','WEBSITE GALLERY PUBLICATION: ZERO'):q(token in wf,'Build 304 workflow boundary missing '+token)
q(p.get('roadmap')=='docs/operations/RELEASE_467_CAIP_CONTENT_ADOPTION_BUILDS_301_306.md','Build 304 roadmap pointer mismatch')
if int(p.get('build') or 0)==304:q(int(p.get('next_build') or 0)==305 and p.get('next_build_title')=='Buyer Discovery & Search Measurement Activation','Build 305 successor pointer missing')
else:q(int(p.get('build') or 0)>=305,'Build 304 successor must retain Build 305 or newer current authority')
print('RELEASE 467 BUILD 304 WORKSHOP JOURNAL & SOCIAL REVIEW-FIRST PUBLICATION ACCEPTANCE')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
