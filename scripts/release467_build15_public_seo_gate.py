#!/usr/bin/env python3
"""Release 467 Build 15: full checked-in indexable public HTML SEO quality pass."""
from html.parser import HTMLParser
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
FAIL = []

class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.h1 = 0; self.title = ''; self._title = False
        self.meta = {}; self.canonical = ''; self.links = []; self.images = []; self.jsonld = 0
    def handle_starttag(self, tag, attrs):
        a = {str(k).lower(): (v or '') for k,v in attrs}
        tag = tag.lower()
        if tag == 'h1': self.h1 += 1
        elif tag == 'title': self._title = True
        elif tag == 'meta':
            key = (a.get('name') or a.get('property') or '').lower()
            if key: self.meta[key] = a.get('content','').strip()
        elif tag == 'link' and 'canonical' in a.get('rel','').lower(): self.canonical = a.get('href','').strip()
        elif tag == 'a': self.links.append(a.get('href','').strip())
        elif tag == 'img': self.images.append(a)
        elif tag == 'script' and a.get('type','').lower() == 'application/ld+json': self.jsonld += 1
    def handle_endtag(self, tag):
        if tag.lower() == 'title': self._title = False
    def handle_data(self, data):
        if self._title: self.title += data

def audit(path: Path):
    raw = path.read_text(encoding='utf-8', errors='replace')
    p = AuditParser(); p.feed(raw)
    robots = p.meta.get('robots','').lower()
    if 'noindex' in robots: return None
    # Public release pages are canonical Devil n Dove pages or explicitly indexable.
    if 'devilndove.com/' not in p.canonical and 'index' not in robots: return None
    rel = path.relative_to(ROOT).as_posix()
    errors = []
    if p.h1 != 1: errors.append(f'exactly one H1 required (found {p.h1})')
    title = re.sub(r'\s+', ' ', p.title).strip()
    if len(title) < 10: errors.append('title under 10 characters')
    desc = p.meta.get('description','').strip()
    if len(desc) < 40: errors.append('meta description under 40 characters')
    if not p.canonical.startswith('https://devilndove.com/'): errors.append('canonical must use https://devilndove.com/')
    internal = [href for href in p.links if href.startswith('/') and not href.startswith('//')]
    if len(internal) < 2: errors.append('fewer than two crawlable internal links')
    for index, image in enumerate(p.images, 1):
        if not image.get('src','').strip(): errors.append(f'image {index} missing src')
        decorative = image.get('role','').lower() == 'presentation' or image.get('aria-hidden','').lower() == 'true'
        if 'alt' not in image: errors.append(f'image {index} missing alt attribute')
        elif not decorative and len(image.get('alt','').strip()) < 3: errors.append(f'image {index} missing meaningful alt text')
    if p.jsonld < 1: errors.append('applicable structured data script missing')
    return rel, errors

results = []
for path in sorted(ROOT.rglob('*.html')):
    rel = path.relative_to(ROOT).as_posix()
    if rel.startswith(('admin/','.git/')): continue
    result = audit(path)
    if result: results.append(result)

if len(results) < 20:
    FAIL.append(f'public SEO audit scope unexpectedly small: {len(results)} indexable pages')
for rel, errors in results:
    if errors: FAIL.append(f"{rel}: {'; '.join(errors)}")

# Dynamic Product parity must explicitly replace generic page schema with visible facts.
product_html = (ROOT/'shop/product/index.html').read_text(encoding='utf-8', errors='replace')
product_parity = (ROOT/'public/js/product-detail-parity.js').read_text(encoding='utf-8', errors='replace')
shared = (ROOT/'public/js/storefront-parity.js').read_text(encoding='utf-8', errors='replace')
for token in ('storefront-parity.js','product-detail-parity.js'):
    if token not in product_html: FAIL.append(f'Product Detail missing parity script: {token}')
for token in ('Product','Offer','BreadcrumbList','priceCurrency','availability','shippingDestination','additionalProperty'):
    if token not in shared: FAIL.append(f'shared Product schema parity missing: {token}')
if "schema.setAttribute('data-storefront-parity', 'visible-facts')" not in product_parity:
    FAIL.append('Product Detail does not mark visible-fact schema parity')

if FAIL:
    print('FAIL Release 467 Build 15 public SEO parity gate')
    for item in FAIL: print(f'- {item}')
    sys.exit(1)
print('PASS Release 467 Build 15 public SEO parity gate')
print(f'indexable_public_pages={len(results)}')
print('one_h1_title_meta_canonical_internal_links_image_alt_structured_data=GUARDED')
print('product_offer_breadcrumb_visible_fact_parity=GUARDED')
