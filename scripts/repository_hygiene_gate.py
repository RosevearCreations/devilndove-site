#!/usr/bin/env python3
"""Current repository hygiene, route, accessibility, SEO and private-admin guardrails."""
from __future__ import annotations
import json,re
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok: FAIL.append(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def route_exists(route):
 path=urlparse(route).path
 if not path.startswith('/') or path.startswith(('/api/','/cdn-cgi/')): return True
 clean=path.lstrip('/')
 if not clean:return (ROOT/'index.html').exists()
 c=ROOT/clean
 return (c/'index.html').exists() if path.endswith('/') else c.exists() or (ROOT/f'{clean}.html').exists() or (c/'index.html').exists()
legacy=[]
for p in ROOT.glob('BUILD*'):
 if p.is_file() and (re.match(r'^BUILD\d+.*(?:D1|VERIFICATION).*\.sql$',p.name,re.I) or p.name.lower().endswith(('.bak','.old','.tmp'))):legacy.append(p.name)
req(not legacy,f'obsolete root Build verification artifacts remain: {legacy}')
bad=[]
for p in ROOT.rglob('*'):
 if not p.is_file():continue
 rel=p.relative_to(ROOT)
 if any(x in {'.git','node_modules','.wrangler','.pytest_cache','__pycache__'} for x in rel.parts):continue
 if p.name.lower().endswith(('.bak','.old','.tmp','.orig','.rej')) or p.name.endswith('~'):bad.append(str(rel))
req(not bad,f'backup/temp artifacts must not ship: {bad[:20]}')
for p in ('tmp','docs/archive','docs/releases'):req(not (ROOT/p).exists(),f'{p} must not ship')
for p in ('AI_CONTEXT.md','NEW_CHAT_STATUS.md','DEVELOPMENT_ROADMAP.md','KNOWN_GAPS_AND_RISKS.md','data/site/release-package-manifest.json'):req(not (ROOT/p).exists(),f'retired current-state artifact must not return: {p}')
release=json.loads(read('development-release.json'))
req(release.get('release')==453,'repository hygiene gate requires current Release 453')
req(release.get('label')=='I.T. Provider Readiness & Acceptance Authority','Release 453 label drifted')
req(release.get('current_release_migrations')==['migrations/dev/20260829_release453_it_provider_readiness.sql'],'Release 453 migration authority drifted')
for page in ('shop/index.html','shop/product/index.html','collections/index.html','collages/index.html'):
 html=read(page);req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{page} must contain exactly one H1');req('rel="canonical"' in html or "rel='canonical'" in html,f'{page} missing canonical');req('og:title' in html and 'og:description' in html and 'og:url' in html,f'{page} missing Open Graph depth');req('twitter:card' in html,f'{page} missing Twitter card');req('application/ld+json' in html,f'{page} missing JSON-LD')
 for tag in re.findall(r'<img\b[^>]*>',html,re.I):req(re.search(r'\balt\s*=',tag,re.I) is not None,f'{page} image missing alt')
for page in ('shop/index.html','collections/index.html','collages/index.html'):req('"@type":"CollectionPage"' in read(page),f'{page} must retain CollectionPage schema')
product=read('shop/product/index.html');req('aria-label="Breadcrumb"' in product and 'id="productBreadcrumbLabel"' in product,'Product breadcrumb authority missing');req('/public/js/product-breadcrumb-seo.js?v=452' in product,'Release 452 Product breadcrumb carry-forward missing')
product_js=read('public/js/product-detail.js');req("'@type': data.product.schema_type || 'Product'" in product_js and "'@type': 'Offer'" in product_js,'Product/Offer JSON-LD authority missing')
breadcrumb=read('public/js/product-breadcrumb-seo.js');req('BreadcrumbList' in breadcrumb and 'MutationObserver' in breadcrumb and 'fetch(' not in breadcrumb,'Product breadcrumb JSON-LD drifted')
sitemap=read('sitemap.xml')
for route in ('/shop/','/shop/product/','/collections/','/collages/'):req(f'https://devilndove.com{route}' in sitemap,f'sitemap missing {route}')
req('/admin/' not in sitemap and '/api/' not in sitemap,'sitemap must never expose admin/API routes')
for page in ('shop/index.html','shop/product/index.html','collections/index.html','collages/index.html'):
 for href in re.findall(r'\bhref=[\"\']([^\"\']+)[\"\']',read(page),re.I):
  if href.startswith(('#','mailto:','tel:','javascript:','http://','https://')):continue
  req(route_exists(href),f'{page} references missing route {href!r}')
for page in ('admin/inventory-intelligence/index.html','admin/tool-lifecycle/index.html','admin/caip-content-handoff/index.html','admin/accounting/index.html','admin/marketplace-calibration/index.html','admin/it-integrations/index.html','admin/it-platform/index.html'):
 html=read(page);req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{page} must contain exactly one H1');req('noindex,nofollow' in html,f'{page} must remain noindex,nofollow')
req('aria-live="polite"' in read('admin/it-integrations/index.html'),'I.T. readiness workspace must announce dynamic status')
wrangler=read('wrangler.toml');req('account_id =' not in wrangler,'wrangler.toml must never pin account_id')
req(release.get('release_policy',{}).get('production_promotion')=='closed','Production promotion must remain closed');req(release.get('release_policy',{}).get('provider_publication')=='closed','provider publication must remain closed')
print('REPOSITORY HYGIENE / UX / SEO GATE')
print('Obsolete root Build verification artifacts: NONE');print('Backup/temp/current-state debris: NONE');print('Storefront SEO/one-H1/structured data: GUARDED');print('Private admin noindex: GUARDED');print('Release 453 I.T. readiness workspace: GUARDED');print('Production/provider publication: CLOSED')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('REPOSITORY HYGIENE / UX / SEO GATE: PASS')
