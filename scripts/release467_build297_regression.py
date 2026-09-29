#!/usr/bin/env python3
"""Release 467 Build 297 search-first Product/story SEO and crawl-control regression."""
from pathlib import Path
import sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def q(ok,msg):
    if not ok:F.append(msg)
mw=t('functions/_middleware.js')
helper=t('functions/api/_lib/publicSearchSeo.js')
product=t('public/js/product-detail-v166.js')
story=t('public/js/workshop-journal-story.js')
seo=t('public/js/seo-page-overrides.js')
sitemap=t('sitemap.xml')
robots=t('robots.txt')
for token in ("loadPublishedProductSeo","loadPublishedStorySeo","loadDynamicSitemapEntries","dynamicSitemapResponse","build297InitialProductSnapshot","build297InitialProductJsonLd","build297InitialStorySnapshot","shopRequest?.filtered"):
    q(token in mw,'middleware search-first contract missing: '+token)
for token in ("Product","Offer","BreadcrumbList","BlogPosting","content_status='published'","review_status","canonicalProductUrl","canonicalStoryUrl"):
    q(token in helper,'search-first helper missing: '+token)
q("published?'index,follow':'noindex,follow'" in mw,'published-only dynamic index rule missing')
q("element.setAttribute('content','noindex,follow')" in mw and "shopRequest.canonical" in mw,'Shop query noindex/canonical rule missing')
q("dynamic-published-v297" in mw and "max-age=3600" in mw,'dynamic sitemap cache/source marker missing')
q("initialProductSnapshot()" in product and product.count("/api/product-detail-core?slug=")==1,'Product must reuse server snapshot with one fallback core endpoint reference')
q("initialStorySnapshot()" in story and story.count("/api/workshop-journal?destination=workshop_journal&story=")==1,'Story must reuse server snapshot with one fallback publication endpoint reference')
q("build297InitialProductJsonLd" in seo,'legacy SEO enhancer must recognize server Product JSON-LD')
q("data-search-first-seo','build297" in mw and "data.dataset.searchFirstSeo !== 'build297'" in story,'story client must preserve server structured-data authority')
q('Sitemap: https://devilndove.com/sitemap.xml' in robots,'robots sitemap declaration missing')
q('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' in sitemap,'static sitemap canonical source missing')
for forbidden in ("INSERT INTO","UPDATE PRODUCTS","DELETE FROM","ALTER TABLE","CREATE TABLE","DROP TABLE"):
    q(forbidden not in helper.upper(),'SEO helper must remain read-only: '+forbidden)
print('RELEASE 467 BUILD 297 SEARCH-FIRST HTML, PRODUCT + STORY SEO & CRAWL CONTROL')
if F:
    print('FAIL')
    [print('-',x) for x in F]
    sys.exit(1)
print('PASS')
print('Initial Product/story metadata: SERVER HTML')
print('Structured data: PRODUCT/OFFER/BREADCRUMB + BLOGPOSTING/BREADCRUMB')
print('Filtered Shop permutations: NOINDEX,FOLLOW / CANONICAL SHOP')
print('Published dynamic sitemap coverage: ACTIVE')
