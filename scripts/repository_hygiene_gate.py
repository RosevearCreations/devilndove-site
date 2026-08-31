#!/usr/bin/env python3
"""Current repository hygiene, route, accessibility, SEO and private-admin guardrails."""
from __future__ import annotations
import json,re
from pathlib import Path
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def route_exists(route):
 path=urlparse(route).path
 if not path.startswith('/') or path.startswith(('/api/','/cdn-cgi/')):return True
 clean=path.lstrip('/');c=ROOT/clean
 if not clean:return (ROOT/'index.html').exists()
 return (c/'index.html').exists() if path.endswith('/') else c.exists() or (ROOT/f'{clean}.html').exists() or (c/'index.html').exists()
legacy=[p.name for p in ROOT.glob('BUILD*') if p.is_file() and (re.match(r'^BUILD\d+.*(?:D1|VERIFICATION).*\.sql$',p.name,re.I) or p.name.lower().endswith(('.bak','.old','.tmp')))]
req(not legacy,f'obsolete root Build verification artifacts remain: {legacy}')
bad=[]
for p in ROOT.rglob('*'):
 if not p.is_file():continue
 rel=p.relative_to(ROOT)
 if any(x in {'.git','node_modules','.wrangler','.pytest_cache','__pycache__'} for x in rel.parts):continue
 if p.name.lower().endswith(('.bak','.old','.tmp','.orig','.rej')) or p.name.endswith('~'):bad.append(str(rel))
req(not bad,f'backup/temp artifacts must not ship: {bad[:20]}')
for p in ('tmp','docs/archive','docs/releases'):req(not (ROOT/p).exists(),f'{p} must not ship')
release=json.loads(read('development-release.json'));current=int(release.get('release') or 0)
req(current>=454,'repository hygiene gate requires Release 454 or later current authority')
if current in {454,455}:req(release.get('current_release_migrations')==[],f'Release {current} must remain source-only')
for page in ('shop/index.html','shop/product/index.html','collections/index.html','collages/index.html'):
 html=read(page);req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{page} must contain exactly one H1');req('rel="canonical"' in html or "rel='canonical'" in html,f'{page} missing canonical');req('og:title' in html and 'og:description' in html and 'og:url' in html,f'{page} missing Open Graph depth');req('twitter:card' in html,f'{page} missing Twitter card');req('application/ld+json' in html,f'{page} missing JSON-LD')
 for tag in re.findall(r'<img\b[^>]*>',html,re.I):req(re.search(r'\balt\s*=',tag,re.I) is not None,f'{page} image missing alt')
for page in ('shop/index.html','collections/index.html','collages/index.html'):req('"@type":"CollectionPage"' in read(page),f'{page} must retain CollectionPage schema')
product=read('shop/product/index.html');req('aria-label="Breadcrumb"' in product and 'id="productBreadcrumbLabel"' in product,'Product breadcrumb authority missing');req('/public/js/product-breadcrumb-seo.js?v=452' in product,'Release 452 Product breadcrumb carry-forward missing')
sitemap=read('sitemap.xml')
for route in ('/shop/','/shop/product/','/collections/','/collages/'):req(f'https://devilndove.com{route}' in sitemap,f'sitemap missing {route}')
req('/admin/' not in sitemap and '/api/' not in sitemap,'sitemap must never expose admin/API routes')
for page in ('admin/storefront-merchandising/index.html','admin/creative-automation/index.html','admin/caip-content-handoff/index.html','admin/accounting/index.html','admin/it-integrations/index.html','admin/inventory-intelligence/index.html','admin/tool-lifecycle/index.html'):
 html=read(page);req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{page} must contain exactly one H1');req('noindex,nofollow' in html,f'{page} must remain noindex,nofollow');req('/css/admin-convergence.css?v=454' in html,f'{page} missing Release 454 shared responsive shell');req('/public/js/admin-module-nav.js?v=454' in html,f'{page} missing Release 454 module nav')
req('fetch(' not in read('public/js/admin-module-nav.js') and 'fetch(' not in read('public/js/admin-workspace-state.js'),'Release 454 shell must remain client-only')
wrangler=read('wrangler.toml');req('account_id =' not in wrangler,'wrangler.toml must never pin account_id')
policy=release.get('release_policy',{})
req(policy.get('production_promotion')=='exact_green_development_tree_only','Production must remain behind the exact green Development-tree promotion gate')
req(policy.get('main_only_application_patches') is False,'main-only application patches must remain forbidden')
req(policy.get('provider_publication')=='closed','Provider publication must remain closed unless deliberately authorized')
req(policy.get('blind_dev_to_production_data_overwrite') is False,'Production transactional data must never be overwritten from Development')
print('REPOSITORY HYGIENE / UX / SEO GATE');print(f'Current Development release: {current}');print('Obsolete root Build verification artifacts: NONE');print('Storefront SEO/one-H1/structured data: GUARDED');print('Release 454 Admin module/state/responsive shell: CARRIED FORWARD');print('Private admin noindex: GUARDED');print('Production promotion: EXACT GREEN DEVELOPMENT TREE ONLY');print('Provider publication: CLOSED');print('Production data overwrite from Development: FORBIDDEN')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('REPOSITORY HYGIENE / UX / SEO GATE: PASS')
