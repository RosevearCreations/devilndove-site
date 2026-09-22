#!/usr/bin/env python3
"""Current online-help and stale-active-surface hygiene gate."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1];FAIL=[]
def req(ok,msg):
 if not ok:FAIL.append(msg)
def read(p):return (ROOT/p).read_text(encoding='utf-8',errors='replace')
for stale in ('site-auth-ui.js','member-account-tools.js','functions/api/readme.md','admin/release448-calibration/index.html','functions/api/admin/release448-calibration.js','public/js/admin-release448-calibration.js','scripts/release448_calibration_gate.py'):
 req(not (ROOT/stale).exists(),f'stale active/duplicate file remains: {stale}')
manifest=json.loads(read('data/admin-navigation-modules.json'));req('release' not in manifest and 'build' not in manifest,'current navigation metadata must be release/build neutral');raw=read('data/admin-navigation-modules.json');req('/admin/help/' in raw,'current navigation must expose Online Help Centre');req('release448-calibration' not in raw.lower(),'legacy calibration route must not remain in current navigation');req('/admin/startup-readiness/' not in raw,'numbered startup checklist must not remain in current navigation')
help_html=read('admin/help/index.html');help_lower=help_html.lower();req(len(re.findall(r'<h1(?:\s|>)',help_html,re.I))==1,'online help must contain exactly one H1');req('noindex,nofollow' in help_lower,'admin help must remain noindex,nofollow');req(all(topic in help_lower for topic in ('password','seo','responsive','production','product images','today needs attention')),'online help is missing current operating topics')
public_help=read('help/index.html');public_help_lower=public_help.lower();req(len(re.findall(r'<h1(?:\s|>)',public_help,re.I))==1,'public help must contain exactly one H1');req(all(topic in public_help_lower for topic in ('shopping','product images','wishlist','custom requests','contextual help')),'public Customer Help Centre is missing current customer topics')
req('data-help-audience="customer"' in public_help,'public help must identify the customer audience')
req('data-help-audience="creator-and-up"' in help_html,'admin help must identify the Creator-and-up audience')
context=read('public/js/admin-context-help.js')
for key in ('password_security:','seo_search:','responsive_layout:','release_promotion:','deferred_it_test:','online_help:','product_media:','product_image_fit:','today_attention:','runtime_incident:','media_studio:','creative_project:'):req(key in context,f'contextual help missing {key}')
req('fetch(' not in context and 'apiFetch' not in context,'contextual help must remain client-only');req('<h1' not in context.lower(),'contextual help must never create H1 markup');req(not re.search(r'\b(?:Release|Build)\s+\d+',context),'current contextual help must not present numbered release/build guidance')
route=read('public/js/admin-route-usage.js');req('release448-calibration' not in route.lower(),'admin dashboard must not advertise legacy calibration');req('Online Help Centre' in route,'admin dashboard should advertise current help')
hub=read('public/js/admin-module-hub.js');req(not re.search(r'\b(?:Release|Build)\s+\d+',hub),'current module hub must be release/build neutral')
doc=read('docs/architecture/admin-context-help.md');req('Release 448' not in doc and 'current_help_hygiene_gate.py' in doc,'context-help architecture doc is stale')
startup=read('admin/startup-readiness/index.html');req('former numbered startup checklist has been retired' in startup.lower(),'legacy startup route must direct operators to current readiness guidance')
req(not re.match(r'\s*#\s*Build\s+\d+',read('readme.md'),re.I),'root README must not present a numbered build as current authority')
print('CURRENT HELP / STALE SURFACE HYGIENE GATE')
if FAIL:
 for i,x in enumerate(FAIL,1):print(f'{i:03d}. FAIL — {x}')
 raise SystemExit(1)
print('CURRENT HELP / STALE SURFACE HYGIENE GATE: PASS')
