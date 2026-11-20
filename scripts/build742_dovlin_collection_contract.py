#!/usr/bin/env python3
"""Build 742: verify every owner-supplied Dovlin asset, legend, and non-commerce boundary."""
from __future__ import annotations
import hashlib,json,re
from pathlib import Path
from collections import Counter

ROOT=Path(__file__).resolve().parents[1]
DOV=ROOT/'dovlin'
FAIL=[]
def check(condition,message):
    if not condition:FAIL.append(message)

def read(path):return (ROOT/path).read_text(encoding='utf-8')
seed=json.loads(read('dovlin/data/collection_seed.json'))
manifest=json.loads(read('dovlin/data/asset_manifest.json'))
checksums=json.loads(read('dovlin/data/build742_source_sha256.json'))
dims=json.loads(read('dovlin/data/image_dimensions.json'))
check(seed.get('slug')=='dovlin','collection slug changed')
check(len(seed['featured_plush'])==10,'expected exactly ten planned plush concepts')
check(len(seed['shop_concepts'])==38,'38 original maker concepts required')
check(len(seed['colour_lab'])==20,'20 cropped future colours required')
check(len(seed['original_colourway_sheets'])==4,'four original 5-up sheets required')
check(len(manifest['uploaded_assets'])==48,'48 original source images required')
check(len(manifest['cropped_colourways'])==20,'20 named cropped source images required')
check(seed['total_uploaded_assets']==48,'source count drifted')
expected=['Original Crimson','Royal Amethyst','Burgundy Shadow','Midnight Eclipse',
          'Lavender Dream','Ivory Dove','Frost Dove','Silver Moon','Emerald Treasure','Rose Quartz']
check([p['name'] for p in seed['featured_plush']]==expected,'edition order/name drifted')
check(seed['featured_plush'][0]['slug']=='original-crimson','red founding hero must be first')
for e in seed['featured_plush']:
    check(e['state'] in ('concept_only','prototype_planned'),f'edition not concept only: {e["name"]}')
    check('price' not in e and 'inventory' not in e and 'buy' not in e,f'edition commerce spoof: {e["name"]}')
for e in seed['shop_concepts']:
    check(e.get('status')=='concept_only' and e.get('price') is None and e.get('inventory') is None,
          f'concept unexpectedly for sale: {e["id"]}')
for name in ('Burgundy Shadow','Ivory Dove','Silver Moon'):
    entry=next(x for x in seed['featured_plush'] if x['name']==name)
    check(entry.get('art_match')=='provisional_approximation',f'missing owner match hold {name}')
check(all(x.get('art_match')!='provisional_approximation' for x in seed['featured_plush'] if x['name'] not in ('Burgundy Shadow','Ivory Dove','Silver Moon')),
      'unexpected artwork mismatch')
source=read('dovlin/The_Legend_of_Dovlin_APPROVED.txt').split('Previously approved narration; retain this wording for the canonical story section.',1)
check(len(source)==2,'approved lore source preamble missing')
if len(source)==2:
    check(seed['canonical_story']==source[1].strip(),'legend differs from exact APPROVED source')
    check('A little kindness can change someone\'s world.' in seed['canonical_story'],'gold dove kindness canon altered')
imagepaths=[f'dovlin/assets/{p.name}' for p in (DOV/'assets').glob('*.webp')]
thumbpaths=[f'dovlin/thumbs/{p.name}' for p in (DOV/'thumbs').glob('*.webp')]
check(len(imagepaths)==68,'expected 68 on-site original concept / crop WebPs')
check(len(thumbpaths)==68,'expected 68 on-site gallery WebP thumbnails')
check(len(checksums['files'])==139,'expected owner source hash record for 68+68+3 files')
for rel,expected_hash in checksums['files'].items():
    f=ROOT/rel
    check(f.is_file(),f'asset missing: {rel}')
    if f.is_file():check(hashlib.sha256(f.read_bytes()).hexdigest()==expected_hash,f'source asset altered: {rel}')
check(set(dims)==set(s.removeprefix('dovlin/') for s in imagepaths+thumbpaths),'image dimension map incomplete')
for asset in manifest['uploaded_assets']:
    for k in ('id','source_filename','title','category','description','manufacturing_note','site_image','thumbnail','alt'):
        check(bool(asset.get(k)),f'manifest missing {k} for {asset.get("id")}')
    check(asset['commercial_status']=='concept_only',f'commercial status changed {asset["id"]}')
    for key in ('site_image','thumbnail'):
        check((DOV/asset[key]).exists(),f'missing referenced file {asset[key]}')
for e in seed['featured_plush']:
    check((DOV/e['art']).exists(),f'missing plush concept image {e["name"]}')
for e in seed['colour_lab']:
    for key in ('image','thumb'):
        check((DOV/e[key]).exists(),f'missing colour source {e["name"]}/{key}')
for e in seed['original_colourway_sheets']:
    check((DOV/e['image']).exists(),f'missing sheet {e["title"]}')
check(len(set(x['source_index'] for x in manifest['uploaded_assets']))==48,'duplicate source asset index')
check(len(set(e['image'] for e in seed['colour_lab']))==20,'duplicate future colour card')
html=read('dovlin/index.html')
js=read('dovlin/app.js')
css=read('dovlin/styles.css')
check('<html lang="en-CA">' in html,'Canadian locale missing')
check('<link rel="canonical" href="https://devilndove.com/dovlin/">' in html,'canonical missing')
check('<meta name="robots" content="index,follow">' in html,'SEO indexing missing')
check('44_original-crimson-master-art.webp' in html,'approved Original Crimson hero missing')
check('loading="lazy"' in html,'lazy loading missing')
check('dv-workshop-search' in html and 'dv-category-filters' in html,'category/search controls missing')
check('dv-lightbox' in html and 'dv-lightbox-prev' in html and 'dv-lightbox-next' in html,'lightbox controls missing')
check('aria-live="polite"' in html and 'dv-skip' in html,'accessibility skip/status missing')
check('collector-passport-concept.pdf' in html and (DOV/'collector-passport-concept.pdf').exists(),'concept passport missing')
check('Dovlin &amp; His Mates' in html,'hero title missing')
check('concept' in html.lower() and 'in development' in html.lower(),'public concept disclosure missing')
check('showModal()' in js and 'ArrowLeft' in js and 'ArrowRight' in js,'keyboard gallery navigation missing')
check('fetch(prefix+p' in js and 'textContent=story' in js,'runtime approved canonical story source missing')
check('p.art_match' in js and 'Shadow Ruby' in js and 'Moonstone' in js and 'Gold Edition' in js,'explicit provisional image labels missing')
check('no D1' in js or 'No D1' in js,'non-commerce runtime boundary not explicit')
check('prefers-reduced-motion' in css,'reduced-motion style missing')
check('max-width:480px' in css,'narrow/mobile layout missing')
check(not re.search(r'<button[^>]*(?:buy|cart|checkout)',html,re.I),'false live-buy button present')
for page in ('index.html','shop/index.html','collections/index.html'):
    check('href="/dovlin/"' in read(page),f'entrypoint missing from {page}')
check('https://devilndove.com/dovlin/' in read('sitemap.xml'),'new route absent from sitemap')
check('/dovlin /dovlin/ 301' in read('_redirects'),'canonical redirect missing')
if FAIL:
    print('BUILD 742 DOVLIN SOURCE CONTRACT: FAIL')
    for f in FAIL:print(' -',f)
    raise SystemExit(1)
print('BUILD 742 DOVLIN SOURCE CONTRACT: PASS')
print('Original source images: 48 | single colour crops: 20 | thumbnails: 68')
print('Exactly 10 planned editions, 38 workshop concepts, 4 source lineup sheets; lore exact, owner art holds, no invented buy or stock.')
