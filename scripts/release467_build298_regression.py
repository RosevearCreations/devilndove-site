#!/usr/bin/env python3
from pathlib import Path
import sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def q(ok,msg):
    if not ok:F.append(msg)
merchant=t('functions/api/_lib/merchantSearchDistribution.js')
feed=t('functions/api/merchant-feed.js')
admin=t('functions/api/admin/merchant-search-distribution.js')
ui=t('public/js/admin-merchant-search-distribution.js')
seo=t('functions/api/_lib/publicSearchSeo.js')
mw=t('functions/_middleware.js')
page=t('admin/local-seo-review/index.html')
for token in ('merchantCoverage','merchantRssXml','merchantTsv','target_country','CAD','merchant_shipping_not_confirmed','merchant_return_policy_not_confirmed'):
    q(token in merchant,'Merchant helper missing '+token)
for token in ('application/rss+xml','provider_execution:false','review_first:true','X-DD-Merchant-Feed'):
    q(token in feed,'Merchant feed missing '+token)
for token in ('submit_indexnow','SUBMIT INDEXNOW','INDEXNOW_KEY','INDEXNOW_KEY_LOCATION','automatic_submission:false','explicit_owner_authorization:true'):
    q(token in admin,'IndexNow admin contract missing '+token)
q("fetch(endpoint" in admin,'IndexNow provider call missing')
q("action!=='submit_indexnow'" in admin,'IndexNow provider call must be explicitly action-scoped')
q("merchantSearchDistributionMount" in page and "admin-merchant-search-distribution.js?v=467b298" in page,'SEO admin page missing Build 298 distribution diagnostics')
q("loadProductDiscoveryLinks" in seo and "loadStoryDiscoveryLinks" in seo,'Factual discovery relationships missing')
q("data-build298-related-discovery" in mw and "discoveryLinksMarkup" in mw,'Initial HTML related-content links missing')
for forbidden in ('CREATE TABLE','ALTER TABLE','DROP TABLE','INSERT INTO PRODUCTS','UPDATE PRODUCTS','DELETE FROM PRODUCTS'):
    q(forbidden not in merchant.upper() and forbidden not in admin.upper(), 'Build 298 request-time mutation token present: '+forbidden)
print('RELEASE 467 BUILD 298 MERCHANT/SEARCH DISTRIBUTION + PUBLIC CONTENT DISCOVERY')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Merchant feed: REVIEWED / CANADA / CAD')
print('IndexNow: EXPLICIT OWNER ACTION ONLY')
print('Public discovery links: FACTUAL RELATIONSHIPS ONLY')
