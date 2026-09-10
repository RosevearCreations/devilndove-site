#!/usr/bin/env python3
"""Current phone/tablet/PC/web responsive source gate."""
from pathlib import Path
import xml.etree.ElementTree as ET
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):return (ROOT/p).read_text(encoding='utf-8',errors='replace')
tree=ET.fromstring(read('sitemap.xml'));ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
for node in tree.findall('s:url/s:loc',ns):
 url=(node.text or '').strip();path=urlsplit(url).path;rel='index.html' if path=='/' else f"{path.strip('/')}/index.html";html=read(rel).lower();req('name="viewport"' in html or "name='viewport'" in html,f'{rel}: viewport metadata missing')
css_raw=read('css/current-responsive.css');css=css_raw.replace(' ','')
for needle in ('@media(max-width:720px)','@media(max-width:420px)','@media(min-width:1024px)','min-height:44px','overflow-x:auto','max-width:100%','margin-inline:auto!important','.dd-centered-shell','.dd-horizontal-scroll-region'):
 req(needle in css,f'responsive convergence CSS missing {needle}')
req('overflow-x:clip' not in css,'root/application responsive layer must not permanently clip horizontal content')
req('body>.container' in css and 'body>main.container' in css,'top-level application shells must have explicit centered fallback')
req('.container,.admin-shell{width:100%;margin-inline:auto!important}' in css,'shared public/admin shells must remain centered and width-bounded')
layout=read('public/js/layout-overflow-guard.js')
for needle in ('dd-table-scroll','dd-horizontal-scroll-region','MutationObserver','centerShells','normalizeScrollRegion','tabindex'):
 req(needle in layout,f'dynamic centered/overflow guard missing {needle}')
req('h1' not in layout.lower(),'layout guard must not mutate heading hierarchy')
middleware=read('functions/_middleware.js');req('/css/current-responsive.css?v=current' in middleware,'middleware must inject responsive CSS into HTML');req('/public/js/layout-overflow-guard.js?v=current' in middleware,'middleware must inject layout guard into HTML')
help_page=read('admin/help/index.html').lower();req('name="viewport"' in help_page and 'current-responsive.css' in help_page,'online help must use current responsive shell')
print('CURRENT RESPONSIVE LAYOUT GATE');print('Viewports: phone 360/390 • tablet 768 • PC/app 1024+ • wide web')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('CURRENT RESPONSIVE LAYOUT GATE: PASS')
print('Centered shell: PUBLIC + ADMIN')
print('Root horizontal reachability: PRESERVED / NO CLIP')
print('Wide tables: LOCAL KEYBOARD-ACCESSIBLE SCROLL')
