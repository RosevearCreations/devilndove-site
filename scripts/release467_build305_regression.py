#!/usr/bin/env python3
from pathlib import Path
import json,sys,re
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build305-buyer-discovery-search-measurement-activation.json')
prev=j('release467-build304-workshop-journal-social-review-first-publication-acceptance.json')
p=j('current-development-authority.json')
api=t('functions/api/admin/buyer-discovery-measurement.js');ui=t('public/js/admin-buyer-discovery-measurement.js');page=t('admin/local-seo-review/index.html')
wf=t('.github/workflows/release467-build305-buyer-discovery-search-measurement.yml');sql=t('scripts/release467_build305_discovery.sql')
q(a.get('build')==305 and a.get('title')=='Buyer Discovery & Search Measurement Activation','Build 305 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 304 final closure not ingested')
q((prev.get('final_closure') or {}).get('dev_sha')=='3dd7a39513f4dbea3d018675bbf9080397a811fc' and (prev.get('final_closure') or {}).get('tree_sha')=='4c8fe967a08e09327e923f32aeac0df6c901b3bf','Build 304 exact Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='9666c57fd02b199359e2420db0f147c27e5c9386','Build 304 Production checkpoint missing')
for token in ('site_page_views','search_console_page_queries','merchantCoverage','loadDynamicSitemapEntries','loadPublishedStorySeo','explicit_confirmation_required','provider_execution:false','indexnow_submission:false'):
    q(token in api,'Build 305 measurement API missing '+token)
q('export async function onRequestGet' in api and 'onRequestPost' not in api,'Build 305 measurement API must remain GET-only')
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO','UPDATE ','DELETE FROM','fetch('):
    q(forbidden not in api,'Build 305 measurement API mutation/provider token present: '+forbidden)
q('buyerDiscoveryMeasurementMount' in page,'Build 305 SEO workspace mount missing buyerDiscoveryMeasurementMount')
q(any(v in page for v in ('admin-buyer-discovery-measurement.js?v=467b305','admin-buyer-discovery-measurement.js?v=467b311','admin-buyer-discovery-measurement.js?v=467b316')),'Build 305 SEO workspace mount missing compatible buyer discovery script')
q(('Zero discovery is shown as zero' in ui) or ('Zero discovery stays zero' in ui) or ('No query-level SEO action is justified' in ui),'Build 305 UI missing zero-evidence preservation language')
for token in ('Search Console import','automatic submission OFF'):q(token in ui,'Build 305 UI missing '+token)
for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','INDEXNOW SUBMISSION: ZERO','PROVIDER EXECUTION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 305 workflow boundary missing '+token)
q('9445c6a22a26cdae22cef3989f4222f7a149aee3' in json.dumps(a) and int((a.get('measurement_baseline') or {}).get('aggregate_rows_read') or 0)==168,'Build 305 baseline measurement missing')
q((a.get('interpretation') or {}).get('factual_related_capability_links_justified') is False,'Build 305 must not invent related capability links')
q(int(p.get('build') or 0)>=305,'Current pointer must retain Build 305 or successor')
print('RELEASE 467 BUILD 305 BUYER DISCOVERY & SEARCH MEASUREMENT ACTIVATION')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
