#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]
ROUTES=[
'index.html','about/index.html','collections/index.html','contact/index.html','creations/index.html',
'custom-candle-making-ontario/index.html','custom-gifts-southern-ontario/index.html','custom-soap-making-ontario/index.html',
'events/index.html','gallery/index.html','gift-cards/index.html','handmade-jewelry-ontario/index.html',
'laser-engraving-ontario/index.html','pickup/index.html','polymer-clay-earrings-ontario/index.html','socials/index.html','shop/index.html','vintage-finds-ontario/index.html']
errors=[]
asset_pat=re.compile(r'/assets/[A-Za-z0-9_./\-]+')
for rel in ROUTES:
    p=ROOT/rel
    text=p.read_text(encoding='utf-8',errors='ignore')
    if len(re.findall(r'<h1\b',text,re.I))!=1: errors.append(f'{rel}: expected one H1')
    if 'og:image' not in text: errors.append(f'{rel}: missing og:image')
    for tag in re.findall(r'<img\b[^>]*>',text,re.I|re.S):
        if not re.search(r'\balt\s*=\s*["\']',tag,re.I): errors.append(f'{rel}: image missing alt')
    for ref in asset_pat.findall(text):
        if not (ROOT/ref.lstrip('/')).exists(): errors.append(f'{rel}: missing {ref}')
master=json.loads((ROOT/'data/itemsforsale/itemsforsale_items_master.json').read_text(encoding='utf-8'))
for item in master.get('items',[]):
    fallback=item.get('fallback_image','')
    if not fallback or not (ROOT/fallback.lstrip('/')).exists(): errors.append(f"item {item.get('id')}: missing local fallback")
for rel in ('creations/index.html','gallery/index.html'):
    text=(ROOT/rel).read_text(encoding='utf-8')
    for token in ('fallback_image','representative-fallback-badge','setTimeout'):
        if token not in text: errors.append(f'{rel}: missing {token}')
css=(ROOT/'css/styles.css').read_text(encoding='utf-8')
for token in ('.public-service-hero','.representative-fallback-badge','@media(max-width:860px)'):
    if token not in css: errors.append(f'css missing {token}')
if 'devilndove-shell-v18' not in (ROOT/'sw.js').read_text(encoding='utf-8'): errors.append('service worker shell v18 missing')
if errors:
    print('Build 239 public visual test: FAIL')
    print('\n'.join(f'- {e}' for e in errors))
    sys.exit(1)
print(f'Build 239 public visual test: PASS ({len(ROUTES)} routes, {len(master.get("items",[]))} item fallbacks)')
