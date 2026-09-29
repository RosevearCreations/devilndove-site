#!/usr/bin/env python3
"""Release 467 Build 295 buyer-facing source regression."""
from pathlib import Path
import re,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def q(ok,msg):
    if not ok:F.append(msg)
home=t('index.html');shop=t('shop/index.html');nav=t('js/main.js');shopjs=t('public/js/shop.js')
journal=t('workshop-journal/index.html');journal_api=t('workshop-journal.js');case=t('case-studies/index.html');casejs=t('public/js/capability-case-studies.js');audit=t('public/js/storefront-evidence-conversion-audit.js')
for phrase,path in (('Shop something','/shop/'),('Ask us to make something','/custom-request/'),('Watch us try something','/workshop-journal/')):
    q(phrase in home and phrase in nav,f'primary buyer path missing: {phrase}');q(path in home and path in nav,f'primary buyer route missing: {path}')
q('<summary><strong>Advanced filters</strong> — optional</summary>' in shop,'advanced Shop filters are not progressive')
q('id="shopSearchInput"' in shop and 'id="shopCategoryFilter"' in shop and 'id="shopSortFilter"' in shop,'simple Shop search controls missing')
q('id="shopSocialReadyFilter"' not in shop and 'id="shopProofImageFilter"' not in shop and 'id="shopChannelFilter"' not in shop,'operator-like Shop filters remain customer-visible')
for phrase in ('Approved proof','Social-ready proof','trust note(s)'):q(phrase not in shopjs,f'operator-like Product card copy remains: {phrase}')
q('data-workshop-journal-publications' in journal and 'workshopStories' in journal,'reviewed Workshop Story discovery mount missing')
q('Build 200 migration' not in journal_api,'public Journal API still exposes migration language')
q('Content Studio, Media/CAIP review and Content Release authorities' not in case,'Case Studies still exposes internal publication architecture')
q('Reviewed process evidence:' not in casejs,'Case Studies client still exposes evidence terminology')
q('Storefront evidence check</h2>' not in audit and 'Buyer evidence &amp; next step</h3>' not in audit,'legacy Storefront audit labels remain buyer-visible')
for body,label in ((home,'home'),(shop,'shop'),(journal,'journal'),(case,'case studies')):q(len(re.findall(r'<h1(?:\s|>)',body,re.I))==1,f'{label} must retain one H1')
print('RELEASE 467 BUILD 295 STOREFRONT BUYER JOURNEY REGRESSION')
if F:print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS');print('Primary paths: SHOP / CUSTOM / WATCH');print('Shop filters: SIMPLE FIRST / ADVANCED PROGRESSIVE');print('Private media exposure: NONE')
