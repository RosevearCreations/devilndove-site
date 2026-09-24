#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
import json,sys,re
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build247-non-product-visual-coverage-media-placement-closure.json')
p=j('current-development-authority.json')
prev=j('release467-build246-abuse-session-security-operations.json')
m=j('public/data/non-product-visual-coverage-v247.json')
plan=t('SITE_WIDE_NON_PRODUCT_IMAGE_REQUIREMENTS.md')
studio=t('admin/media-content-studio/index.html')
client=t('public/js/admin-non-product-visual-coverage-v247.js')
catalog=j('public/data/media-content-slot-catalog.json')
road=t('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')

q(a.get('build')==247 and a.get('state')=='DEVELOPMENT_CANDIDATE','Build 247 authority identity/state mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 246 predecessor must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='cfd9af8777699b8d7902eef0585693b2152e60c8','Build 246 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='e21f7b9bf60ab8b35ecd3724cee988f2beeebb32','Build 246 Production closure missing')
q(p.get('build')==247 and p.get('next_build')==248 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must expose Build 247 candidate and Build 248 successor')

cov=m.get('coverage') or {}
q(cov.get('priority_a_public_targets')==23,'Priority A target count must remain 23')
q(cov.get('priority_b_admin_targets')==5,'Priority B target count must remain 5')
q(cov.get('priority_c_helpful_targets')==7,'Priority C target count must remain 7')
q(cov.get('tracked_targets_total')==35,'Build 247 must track 35 total targets')
q(cov.get('existing_public_svg_placeholders')==29 and cov.get('existing_public_placeholder_pages')==22,'Build 197 placeholder baseline must remain explicit')
q(len(m.get('public_targets') or [])==23 and len(m.get('admin_targets') or [])==5 and len(m.get('helpful_targets') or [])==7,'Manifest target arrays must match Build 247 counts')
q(all(x.get('product_gallery') is False for x in m.get('public_targets') or []),'Public Build 247 targets must exclude Product gallery media')
q(any(x.get('replacement_policy')=='real_photo_required' for x in m.get('public_targets') or []),'Real-photo requirements must remain explicit')
q(any(x.get('replacement_policy')=='illustration_preferred' for x in m.get('public_targets') or []),'Explanatory public illustration targets must remain explicit')

for token in ('Priority A — Public/customer placeholders','Priority B — Creator/Admin visuals','Priority C — Helpful new visuals','Media & Content Studio','generated imagery as proof','Product Media & Image Editor'):
    q(token.lower() in plan.lower(),f'Source plan missing {token}')
for token in ('mediaVisualCoverage247','Non-Product capture &amp; placement plan','admin-non-product-visual-coverage-v247.js?v=467b247','admin-media-content-studio.js?v=467b197'):
    q(token in studio,f'Media Studio Build 247 integration missing {token}')
for token in ('non-product-visual-coverage-v247.json','real-photo requirements remain open','DDNonProductVisualCoverage247'):
    q(token in client,f'Build 247 projection client missing {token}')

# Retain the exact Build 197 authored-placeholder inventory: 29 unique slots across 22 public pages.
class P(HTMLParser):
    def __init__(self): super().__init__(); self.rows=[]
    def handle_starttag(self,tag,attrs):
        if tag.lower()!='img': return
        d=dict(attrs)
        if d.get('data-media-placeholder')=='1': self.rows.append((d.get('data-media-slot',''),d.get('src','')))
rows=[];pages=set()
for hp in R.rglob('*.html'):
    if any(part in {'.git','node_modules','admin'} for part in hp.parts): continue
    rel=str(hp.relative_to(R)).replace('\\','/')
    route='/' if rel=='index.html' else ('/'+rel[:-10] if rel.endswith('/index.html') else '')
    if not route: continue
    parser=P();parser.feed(hp.read_text(encoding='utf-8',errors='replace'))
    if parser.rows:
        pages.add(route)
        rows.extend((route,k,s) for k,s in parser.rows)
q(len(rows)==29,f'expected 29 public authored placeholders, found {len(rows)}')
q(len(pages)==22,f'expected 22 public placeholder pages, found {len(pages)}')
q(len({(r,k) for r,k,_ in rows})==29,'public placeholder route+slot keys must remain unique')

for path in ('admin/customer-documents/index.html','admin/creative-process/index.html','admin/creative-assets/index.html','admin/social-publishing/index.html','admin/inventory-operations/index.html'):
    body=t(path)
    q('explanatory' in body.lower() or 'illustration' in body.lower(),f'{path} must present its Build 247 visual as explanatory')
    q('not business evidence' in body.lower() or 'not project or product evidence' in body.lower() or 'not publication evidence' in body.lower() or 'not inventory evidence' in body.lower() or 'private-media boundaries' in body.lower(),f'{path} must retain a non-evidentiary boundary')
q('Build 247 help visual' in t('help/index.html'),'Customer Help Centre Build 247 visual missing')
q('Build 247 workspace map' in t('admin/help/index.html'),'Admin Help Centre Build 247 workspace map missing')

q('Build 248 — Refinement Outcomes Review & Roadmap Renewal' in road,'Build 248 successor missing')
q("run_current_contract('scripts/release467_build247_gate.py','Release 467 Build 247')" in sysgate,'System Gate must invoke Build 247')
for k in ('schema_change','request_time_schema_mutation','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','automatic_media_assignment','synthetic_product_evidence','synthetic_workshop_evidence','synthetic_customer_evidence'):
    q(a.get('safety',{}).get(k) is False,f'Build 247 safety drift: {k}')
print('RELEASE 467 BUILD 247 NON-PRODUCT VISUAL COVERAGE MEDIA PLACEMENT CLOSURE')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Coverage: 23 public + 5 Admin + 7 helpful = 35 tracked targets')
print('Public authored placeholders: 29 across 22 pages / evidence-dependent items stay open')
