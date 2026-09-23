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
q(a.get('build')==239,'Build 239 authority identity mismatch')
if int(p.get('build') or 0)==239:
 q(a.get('state')=='DEVELOPMENT_CANDIDATE','Current Build 239 authority must remain Development candidate')
else:
 q(a.get('state')=='PRODUCTION_GREEN','Retained Build 239 authority must carry Production closure')
 final=a.get('final_closure') or {}; prod=a.get('production_checkpoint') or {}
 q(final.get('dev_sha')=='f3594106fd74956e0aae524df7f75e53c84b9916' and final.get('tree_sha')=='3a4b02a5fcebb70475ea12698486fbea3775675a','Retained Build 239 Development closure mismatch')
 q((final.get('proofs') or {})=={'system_gate_run':35862488377,'current_application_quality_run':35862487494,'it_admin_runtime_proof_run':35862488308,'branch_hygiene_run':35862488113},'Retained Build 239 proof set mismatch')
 q(prod.get('main_sha')=='ca2f822ac5811f55abb8385d7e548b61097f24e8' and prod.get('tree_sha')=='3a4b02a5fcebb70475ea12698486fbea3775675a','Retained Build 239 Production tree mismatch')
 q(int(prod.get('production_pages_deploy_run') or 0)==35862809663 and int(prod.get('production_live_resource_integrity_run') or 0)==35862907582,'Retained Build 239 Production proof mismatch')
q(int(p.get('build') or 0)>=239 and p.get('state')=='DEVELOPMENT_GREEN','Current authority must retain Build 239 or a verified successor')
if int(p.get('build') or 0)==239:
 q(p.get('next_build')==240,'Build 239 successor pointer mismatch')
 q(p.get('accepted_dev_sha')=='26bd3f755bd486e41335431136f6fed36cabde9f' and p.get('accepted_dev_tree_sha')=='a29c7d6fe3e7fbfae120000020303dc32ef55419','Build 239 must start from exact Build 238 dev head/tree')
 q((p.get('acceptance') or {})=={'system_gate_run':35859876994,'current_application_quality_run':35859877349,'it_admin_runtime_proof_run':35859876896,'branch_hygiene_run':35859877139},'Build 239 must inherit exact Build 238 four-proof set')
 q(p.get('production_checkpoint',{}).get('main_sha')=='44e52cfc905b7864c31c2921ea5e34146a02361a','Build 239 must retain exact Build 238 Production baseline')
else:
 final=a.get('final_closure') or {}
 q(final.get('dev_sha')=='f3594106fd74956e0aae524df7f75e53c84b9916','Build 240+ must retain exact Build 239 Development closure')
 q((final.get('proofs') or {}).get('system_gate_run')==35862488377,'Build 240+ missing retained Build 239 System proof')
for k in ('automatic_business_action','new_api_authority','d1_business_data_mutation','r2_mutation','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','schema_change'):q(a.get('safety',{}).get(k) is False,f'Build 239 safety drift: {k}')
q('Build 240 — API Read Budget, Cache & Batch Streamlining' in road,'Build 240 successor missing')
q("run_current_contract('scripts/release467_build239_gate.py','Release 467 Build 239')" in sysgate,'System Gate must invoke Build 239')
print('RELEASE 467 BUILD 239 ADMIN SURFACE NAVIGATION CONSOLIDATION')
if F:
 print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
