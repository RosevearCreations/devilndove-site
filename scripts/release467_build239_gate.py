#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
 if not ok:F.append(msg)
nav=j('data/admin-navigation-modules.json');client=t('public/js/admin-surface-consolidation-v239.js');mw=t('functions/_middleware.js');p=j('current-development-authority.json');a=j('release467-build239-admin-surface-navigation-consolidation.json');road=t('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md');sysgate=t('scripts/current_system_gate_provenance_gate.py')
hrefs=[]
owners={}
for m in nav.get('modules',[]):
 for s in m.get('sections',[]):
  for x in s.get('links',[]):
   href=x.get('href');hrefs.append(href);owners.setdefault(href,[]).append(m.get('key'))
q(len(hrefs)==len(set(hrefs)),'Build 239 canonical navigation must not expose duplicate route entries')
q('/admin/local-seo-review/' in hrefs and owners.get('/admin/local-seo-review/')==['storefront'],'Search & SEO Review must have one Storefront navigation owner')
q('/admin/visual-polish/' in hrefs and owners.get('/admin/visual-polish/')==['storefront'],'Responsive Layout Review must have one Storefront navigation owner')
for token in ('DDAdminSurfaceConsolidationV239','dedupeExactLinks','canonicalOwners','data-dd-canonical-owner-v239','dd:admin-surface-consolidation-ready'):q(token in client,f'Build 239 client missing {token}')
q('location.replace(' not in client and 'location.href=' not in client,'Build 239 must preserve deep links without forced redirects')
q("ADMIN_SURFACE_CONSOLIDATION_REVISION = '467b239-admin-surface-consolidation-v1'" in mw and 'admin-surface-consolidation-v239.js' in mw,'Build 239 shared bootstrap missing')
q(a.get('build')==239 and a.get('state')=='DEVELOPMENT_CANDIDATE','Build 239 authority identity/state mismatch')
q(p.get('build')==239 and p.get('next_build')==240 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must expose Build 239 and successor 240')
q(p.get('accepted_dev_sha')=='26bd3f755bd486e41335431136f6fed36cabde9f' and p.get('accepted_dev_tree_sha')=='a29c7d6fe3e7fbfae120000020303dc32ef55419','Build 239 must start from exact Build 238 dev head/tree')
q((p.get('acceptance') or {})=={'system_gate_run':35859876994,'current_application_quality_run':35859877349,'it_admin_runtime_proof_run':35859876896,'branch_hygiene_run':35859877139},'Build 239 must inherit exact Build 238 four-proof set')
q(p.get('production_checkpoint',{}).get('main_sha')=='44e52cfc905b7864c31c2921ea5e34146a02361a','Build 239 must retain exact Build 238 Production baseline')
for k in ('automatic_business_action','new_api_authority','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','schema_change'):q(a.get('safety',{}).get(k) is False,f'Build 239 safety drift: {k}')
q('Build 240 — API Read Budget, Cache & Batch Streamlining' in road,'Build 240 successor missing')
q("run_current_contract('scripts/release467_build239_gate.py','Release 467 Build 239')" in sysgate,'System Gate must invoke Build 239')
print('RELEASE 467 BUILD 239 ADMIN SURFACE NAVIGATION CONSOLIDATION')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
