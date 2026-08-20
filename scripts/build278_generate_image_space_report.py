#!/usr/bin/env python3
from pathlib import Path
import csv, json, re
try:
    from PIL import Image
except Exception:
    Image=None
ROOT=Path(__file__).resolve().parents[1]
CAT=ROOT/'public/data/media-content-slot-catalog.json'
OUT_MD=ROOT/'docs/media-content/IMAGE_SPACE_REQUIREMENTS.md'
OUT_CSV=ROOT/'docs/media-content/IMAGE_SPACE_REQUIREMENTS.csv'

def current_dims(src):
    if not src: return ''
    f=ROOT/src.lstrip('/')
    if not f.exists(): return 'missing source file'
    try:
        if f.suffix.lower()=='.svg':
            t=f.read_text(encoding='utf-8',errors='ignore')[:5000]
            m=re.search(r'viewBox=["\']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)',t,re.I)
            if m: return f'{int(float(m.group(1)))}×{int(float(m.group(2)))} SVG viewBox'
            wm=re.search(r'width=["\']([\d.]+)',t,re.I); hm=re.search(r'height=["\']([\d.]+)',t,re.I)
            if wm and hm: return f'{int(float(wm.group(1)))}×{int(float(hm.group(1)))} SVG'
            return 'SVG'
        if Image:
            with Image.open(f) as im: return f'{im.width}×{im.height}'
    except Exception: pass
    return ''

def rows():
    d=json.loads(CAT.read_text(encoding='utf-8'))
    out=[]
    def add(group,page,path,s):
        if s.get('slot_type') not in ('image','background'): return
        status=s.get('baseline_visual_status','')
        priority={'required_replacement':'P1 required','recommended_replacement':'P2 recommended','optional_enhancement':'P3 optional','authored_default':'Complete/default'}.get(status,status)
        out.append({
            'group':group,'page':page,'path':path,'slot_key':s.get('slot_key',''),'slot_label':s.get('slot_label',''),
            'type':s.get('slot_type',''),'section':s.get('section',''),'required':'Yes' if s.get('is_required') else 'No',
            'baseline_status':status,'priority':priority,
            'recommended_size':f"{s.get('recommended_width_px','')}×{s.get('recommended_height_px','')}",
            'recommended_aspect':s.get('recommended_aspect',''),'recommended_format':s.get('recommended_format',''),
            'mobile_safe_area':s.get('mobile_safe_area',''),'recommended_use':s.get('recommended_use',''),
            'current_source':s.get('source_snapshot',''),'current_source_dimensions':current_dims(s.get('source_snapshot','')),
            'alt_snapshot':s.get('source_alt_snapshot','')
        })
    for s in d.get('sitewide',[]): add('Shared site','Shared site','@site',s)
    for g in d.get('groups',[]):
        for p in g.get('pages',[]):
            for s in p.get('slots',[]): add(g.get('label',''),p.get('label',''),p.get('path',''),s)
    return out

r=rows(); OUT_MD.parent.mkdir(parents=True,exist_ok=True)
fields=list(r[0].keys())
with OUT_CSV.open('w',newline='',encoding='utf-8-sig') as f:
    w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(r)

from collections import Counter,defaultdict
c=Counter(x['baseline_status'] for x in r)
lines=[]
lines += ['# Devil n Dove Editable Image Space Requirements','',
          '> Build 278 baseline checklist. The Admin Media & Content Studio now loads live D1 assignments and can show which of these baseline locations have already been filled. This file describes the deployed/source baseline, so a live custom assignment may make an item complete even when it appears below as a placeholder.','',
          '## Summary','',
          f'- **139** editable visual locations: **{sum(x["type"]=="image" for x in r)} image slots** and **{sum(x["type"]=="background" for x in r)} background slots**.',
          f'- **{c["required_replacement"]} P1 required replacements** — required locations currently using a placeholder.',
          f'- **{c["recommended_replacement"]} P2 recommended replacements** — optional content locations currently using branded SVG placeholders.',
          f'- **{c["optional_enhancement"]} P3 optional enhancements** — background locations intentionally blank in the authored baseline.',
          f'- **{c["authored_default"]} complete/default locations** already have authored image assets.','',
          '## Standard image targets','',
          '| Use | Recommended file | Notes |','|---|---:|---|',
          '| Hero / banner | 1600×1000 (8:5) | WebP preferred. Keep the main subject in the centre 70%. |',
          '| Content / section visual | 1600×1000 (8:5) | WebP preferred. Keep the key subject in the centre 80%. |',
          '| Page / section background | 1920×1200 (8:5) | Low contrast; allow crop on every edge. |',
          '| Navigation background | 1920×480 (4:1) | Decorative; centre-safe subject/detail only. |',
          '| Footer background | 1920×600 (16:5) | Decorative; preserve text readability. |',
          '| Logo / mark | 1080×1080 (1:1) | Transparent PNG/WebP, ~8% clear padding. |','',
          '## Outstanding baseline images','',
          'Use this as a production checklist. P1 should be completed first; P2 improves page credibility/storytelling; P3 is optional decoration and should only be added when it improves rather than competes with readability.','']

for status,title in [('required_replacement','P1 — Required placeholder replacements'),('recommended_replacement','P2 — Recommended placeholder replacements'),('optional_enhancement','P3 — Optional background enhancements')]:
    lines += [f'### {title}','', '| Done | Page | Editable location | Recommended | Slot key |','|---|---|---|---:|---|']
    for x in r:
        if x['baseline_status']!=status: continue
        lines.append(f"| ☐ | {x['page']} | {x['slot_label']} | {x['recommended_size']} ({x['recommended_aspect']}) | `{x['slot_key']}` |")
    lines.append('')

lines += ['## Complete editable visual inventory','',
          '| Page | Type | Location | Required | Baseline | Recommended | Current source |','|---|---|---|---|---|---:|---|']
for x in r:
    src=x['current_source'] or '—'
    lines.append(f"| {x['page']} | {x['type']} | {x['slot_label']} | {x['required']} | {x['priority']} | {x['recommended_size']} {x['recommended_aspect']} | `{src}` |")
lines += ['','## Image authoring rules','',
          '- Do not bake headings, prices, claims or other important text into photographs; keep editable copy in HTML/D1.','- Prefer WebP for public photographic/artwork slots; keep an original high-quality source separately.','- Supply meaningful alt text for informative images. Mark truly decorative backgrounds as decorative rather than forcing keyword-heavy alt text.','- Keep faces, products and key craft detail away from edges because responsive `object-fit: cover` cropping can vary between desktop and mobile.','- Product/catalog images, inventory images, supplies and tools are intentionally **not** part of this list; their specialist admin systems remain authoritative.','']
OUT_MD.write_text('\n'.join(lines),encoding='utf-8')
print(f'wrote {OUT_MD.relative_to(ROOT)} and {OUT_CSV.relative_to(ROOT)} ({len(r)} rows)')
