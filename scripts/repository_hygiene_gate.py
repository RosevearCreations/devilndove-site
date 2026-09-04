#!/usr/bin/env python3
"""Current repository hygiene, public-route and Production-safety guardrails."""
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

bad=[]
for p in ROOT.rglob('*'):
    if not p.is_file():continue
    rel=p.relative_to(ROOT)
    if any(x in {'.git','node_modules','.wrangler','.pytest_cache','__pycache__'} for x in rel.parts):continue
    if p.name.lower().endswith(('.bak','.old','.tmp','.orig','.rej')) or p.name.endswith('~'):bad.append(str(rel))
req(not bad,f'backup/temp artifacts must not ship: {bad[:20]}')
for p in ('tmp','docs/archive','docs/releases'):req(not (ROOT/p).exists(),f'{p} must not ship')
for stale in ('site-auth-ui.js','member-account-tools.js','functions/api/readme.md','admin/release448-calibration/index.html','functions/api/admin/release448-calibration.js','public/js/admin-release448-calibration.js'):
    req(not (ROOT/stale).exists(),f'stale active/duplicate surface remains: {stale}')

manifest=json.loads(read('data/admin-navigation-modules.json'))
req('release' not in manifest and 'build' not in manifest,'current admin navigation must be release/build neutral')
for module in manifest.get('modules',[]):
    for section in module.get('sections',[]):
        for link in section.get('links',[]):
            req(route_exists(link.get('href','')),f"navigation route missing: {link.get('href')}")
req('/admin/help/' in read('data/admin-navigation-modules.json'),'current Online Help Centre must remain navigable')

for page in ('shop/index.html','shop/product/index.html','collections/index.html','collages/index.html'):
    html=read(page)
    req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{page} must contain exactly one H1')
    req('rel="canonical"' in html or "rel='canonical'" in html,f'{page} missing canonical')
    req('og:title' in html and 'og:description' in html and 'og:url' in html,f'{page} missing Open Graph depth')
    req('twitter:card' in html,f'{page} missing Twitter card')
    req('application/ld+json' in html,f'{page} missing JSON-LD')
    for tag in re.findall(r'<img\b[^>]*>',html,re.I):req(re.search(r'\balt\s*=',tag,re.I) is not None,f'{page} image missing alt')
for page in ('shop/index.html','collections/index.html','collages/index.html'):
    req('"@type":"CollectionPage"' in read(page),f'{page} must retain CollectionPage schema')

sitemap=read('sitemap.xml')
for route in ('/shop/','/collections/','/collages/'):req(f'https://devilndove.com{route}' in sitemap,f'sitemap missing {route}')
for forbidden in ('/shop/product/','/search/','/admin/','/api/','/members/','/cart/','/login/'):req(f'https://devilndove.com{forbidden}' not in sitemap,f'sitemap must not expose {forbidden}')
req('content="noindex,follow"' in read('search/index.html'),'internal search must remain noindex,follow')

for page in ('admin/storefront-merchandising/index.html','admin/creative-automation/index.html','admin/caip-content-handoff/index.html','admin/accounting/index.html','admin/it-integrations/index.html','admin/inventory-intelligence/index.html','admin/tool-lifecycle/index.html','admin/help/index.html'):
    html=read(page);req(len(re.findall(r'<h1(?:\s|>)',html,re.I))==1,f'{page} must contain exactly one H1');req('noindex,nofollow' in html,f'{page} must remain noindex,nofollow')

wrangler=read('wrangler.toml');req('account_id =' not in wrangler,'wrangler.toml must never pin account_id')
release=json.loads(read('development-release.json'));policy=release.get('release_policy',{})
req(policy.get('production_promotion')=='exact_green_development_tree_only','Production must remain behind the exact green Development-tree promotion gate')
req(policy.get('main_only_application_patches') is False,'main-only application patches must remain forbidden')
req(policy.get('provider_publication')=='closed','Provider publication must remain closed unless deliberately authorized')
req(policy.get('blind_dev_to_production_data_overwrite') is False,'Production transactional data must never be overwritten from Development')

print('REPOSITORY HYGIENE / UX / SEO GATE')
print('Active navigation/help: RELEASE-NEUTRAL')
print('Storefront SEO/one-H1/structured data: GUARDED')
print('Internal search + empty product shell: EXCLUDED FROM SITEMAP')
print('Private admin noindex: GUARDED')
print('Production promotion: EXACT GREEN DEVELOPMENT TREE ONLY')
if FAIL:
    for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
    raise SystemExit(1)
print('REPOSITORY HYGIENE / UX / SEO GATE: PASS')
