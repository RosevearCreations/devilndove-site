#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def text(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(text(path))

a=load('release467-build233-universal-help-quality-of-life-coverage.json')
pointer=load('current-development-authority.json')
h=text('public/js/admin-context-help.js')
pub=text('help/index.html')
adm=text('admin/help/index.html')
mid=text('functions/_middleware.js')
auth=text('public/js/site-auth-ui.js')
arch=text('docs/architecture/admin-context-help.md')
road=text('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
imgs=text('SITE_WIDE_NON_PRODUCT_IMAGE_REQUIREMENTS.md')
sysgate=text('scripts/current_system_gate_provenance_gate.py')
manifest=load('migrations/canonical/manifest.json')

req(a.get('build')==233 and a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 233 authority identity/state')
req(a.get('predecessor',{}).get('production_main_sha')=='d5e9922b629f99c5653f5b884861a2c18358b44f','Build 233 must start from exact Build 232 Production main')
req(a.get('authorization',{}).get('type')=='EXPLICIT_OWNER_NEW_CAPABILITY','Build 233 owner authorization missing')
req(a.get('authorization',{}).get('future_queue_exhausted') is False,'new refinement queue must remain open')
start=(a.get('starting_point') or {}).get('development') or {}
req(pointer.get('build')==233 and pointer.get('title')=='Universal Help & Quality-of-Life Coverage','current authority must identify Build 233')
req(start.get('sha')==pointer.get('accepted_dev_sha') and start.get('tree')==pointer.get('accepted_dev_tree_sha'),'Build 233 starting Development checkpoint must match current pointer')
req(int(start.get('system_gate_run') or 0)==int((pointer.get('acceptance') or {}).get('system_gate_run') or 0),'Build 233 starting System proof must match current pointer')
for token in ('DD_PAGE_HELP_PROFILES','pageHelpProfile(path)','ensurePageLevelHelp(path, ordinal)','ⓘ Customer Help','ⓘ Creator Help','customer_shop','customer_custom','customer_account','creator_storefront','creator_workshop','creator_finance','creator_it'):
    req(token in h,f'shared help runtime missing {token}')
req('fetch(' not in h and 'apiFetch' not in h,'contextual help must remain client-only/read-only')
req('/public/js/admin-context-help.js?v=467b233-universal-help' in mid,'public middleware must inject Build 233 help revision')
req('/public/js/admin-context-help.js?v=467b233-universal-help' in auth,'Creator/Admin bootstrap must load Build 233 help revision')
req('data-help-audience="customer"' in pub and 'Customer Help Centre' in pub,'customer-specific Help Centre missing')
req('data-help-audience="creator-and-up"' in adm and 'Creator &amp; Operations Help Centre' in adm,'Creator-and-up Help Centre missing')
req(len(re.findall(r'<h1(?:\s|>)',pub,re.I))==1,'Customer Help Centre must contain exactly one H1')
req(len(re.findall(r'<h1(?:\s|>)',adm,re.I))==1,'Creator Help Centre must contain exactly one H1')
for token in ('custom requests','orders','gift cards','pickup','contextual help'):
    req(token in pub.lower(),f'Customer Help Centre missing {token}')
for token in ('creator','operations','finance','i.t.','security','recovery','ⓘ'):
    req(token in adm.lower(),f'Creator Help Centre missing {token}')
req('Shared Contextual Help' in arch and 'application-wide page-level coverage' in arch,'help architecture doc missing Build 233 coverage contract')
for n in range(233,249):
    req(f'Build {n}' in road,f'refinement roadmap missing Build {n}')
for phase in ('Quality of life','Streamlining','Security hardening','Visual completeness'):
    req(phase.lower() in road.lower(),f'refinement roadmap missing {phase}')
req('not individual Product gallery images' in imgs,'non-Product image scope boundary missing')
for route in ('/socials/','/marketplaces/','/contact/','/about/','/workshop-journal/','/toolshed/','/tools/','/supplies/','/admin/customer-documents/','/admin/creative-assets/'):
    req(route in imgs,f'non-Product image register missing {route}')
req(len(manifest.get('migrations') or [])==22,'Build 233 must add no canonical migration')
req("run_current_contract('scripts/release467_build232_gate.py','Release 467 Build 232')" in sysgate,'System Gate must retain Build 232')
req("run_current_contract('scripts/release467_build233_gate.py','Release 467 Build 233')" in sysgate,'System Gate must invoke Build 233')

print('RELEASE 467 BUILD 233 UNIVERSAL HELP & QOL COVERAGE')
if FAIL:
    for i,x in enumerate(FAIL,1): print(f'{i:03d}. FAIL — {x}')
    sys.exit(1)
print('RELEASE 467 BUILD 233 UNIVERSAL HELP & QOL COVERAGE: PASS')
