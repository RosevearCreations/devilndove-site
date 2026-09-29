#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build290-inventory-multi-station-read-integrity-client-native-memberships.json')
p=j('current-development-authority.json')
ui=t('public/js/admin-site-item-inventory.js')
helper=t('public/js/admin-site-item-inventory-multistation.js')
wrapper=t('functions/api/admin/site-item-inventory.js')
legacy=t('functions/api/admin/_siteItemInventoryLegacy.js')
mig=t('migrations/canonical/0026_release467_inventory_workstation_memberships.sql')
page=t('admin/inventory-operations/index.html')
sql=t('scripts/release467_build290_measurement.sql')
reg=t('scripts/release467_build290_regression.py')
doc=t('docs/operations/RELEASE_467_BUILD_290_INVENTORY_MULTI_STATION_READ_INTEGRITY.md')
road=t('docs/operations/RELEASE_467_UX_SEARCH_DATABASE_EFFICIENCY_BUILDS_290_300.md')
wf=t('.github/workflows/release467-build290-inventory-multi-station-read-integrity.yml')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('release')==467 and a.get('build')==290 and a.get('title')=='Inventory Multi-Station Read Integrity & Client-Native Memberships','Build 290 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 290 state mismatch')
q((a.get('scope') or {}).get('schema_change') is False,'Build 290 must remain schema-neutral')
q((a.get('scope') or {}).get('n_plus_one_membership_reads') is False,'Build 290 N+1 contract drift')
for token in ('workstationIdsFromScope','workstation_site_item_inventory_ids: workstationIds','workstation_item_names.join'):
    q(token in ui,'Build 290 client-native UI missing '+token)
q('window.fetch = async' not in helper,'Build 290 helper still intercepts global fetch')
q('former window.fetch interception is intentionally retired' in helper,'Build 290 helper retirement marker missing')
for token in ('async function loadWorkstationMemberships','WHERE iwm.site_item_inventory_id IN (','workstationMemberships.get(itemId)','workstation_site_item_inventory_ids: membership.ids','workstation_item_names: membership.names'):
    q(token in wrapper,'Build 290 batched read path missing '+token)
for token in ('saveWorkstationAssignment','workstation_site_item_inventory_ids','DELETE FROM inventory_workstation_memberships','INSERT INTO inventory_workstation_memberships','inventory_station_membership_mismatch'):
    q(token in legacy,'Build 290 write authority missing '+token)
for token in ('PRIMARY KEY(site_item_inventory_id, workstation_site_item_inventory_id)','idx_inventory_workstation_memberships_item','idx_inventory_workstation_memberships_station'):
    q(token in mig,'Build 290 canonical membership schema/index missing '+token)
q('/public/js/admin-site-item-inventory.js?v=290.1' in page and '/public/js/admin-site-item-inventory-multistation.js?v=290.1' in page,'Build 290 Inventory asset revision missing')
q(not re.search(r'(?im)^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE|VACUUM|ATTACH|DETACH)\b',sql),'Build 290 measurement SQL contains mutation/DDL')
for token in ('page_items','page_memberships','invalid_membership_rows','foreign_key_violations','LIMIT 40'):
    q(token in sql,'Build 290 measurement missing '+token)
for token in ('Forge-like 3-station membership reload','Global fetch interception: RETIRED'):
    q(token in reg,'Build 290 regression missing '+token)
q('Build 294 — CAIP Workshop Follies & Maker Story Foundation' in road and 'Build 291 — Public Runtime Reliability & Broken-Surface Closure' in road,'Build 290 successor roadmap drift')
q("run_current_contract('scripts/release467_build290_gate.py','Release 467 Build 290')" in sysgate,'System Gate missing Build 290')
q('D1_ONE_SHOT_EVIDENCE_CAPTURE' in wf and 'development-membership-read-measurement' in wf and "D1_PROVIDER_ROWS_READ_CEILING: '20000'" in wf and "BUILD290_ACCEPTANCE_ROWS_READ_CEILING: '5000'" in wf and 'workflow_dispatch:' in wf and 'devilndove-dev' in wf,'Build 290 D1 measurement workflow missing')
q(int(p.get('build') or 0)>=290,'Current authority must retain Build 290 or successor')
if int(p.get('build') or 0)==290:
    q(p.get('title')=='Inventory Multi-Station Read Integrity & Client-Native Memberships' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 290 pointer mismatch')
    q(int(p.get('next_build') or 0)==291 and p.get('next_build_title')=='Public Runtime Reliability & Broken-Surface Closure','Build 290 successor pointer mismatch')
for path in ('public/js/admin-site-item-inventory.js','public/js/admin-site-item-inventory-multistation.js','functions/api/admin/site-item-inventory.js','functions/api/admin/_siteItemInventoryLegacy.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout))
r=subprocess.run([sys.executable,str(R/'scripts/release467_build290_regression.py')],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
q(r.returncode==0,'Build 290 regression failed: '+(r.stderr or r.stdout))
print('RELEASE 467 BUILD 290 INVENTORY MULTI-STATION READ INTEGRITY')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Client-native memberships: YES')
print('Batched membership read: YES')
print('Global fetch interception: RETIRED')
print('Next: Build 291 — Public Runtime Reliability & Broken-Surface Closure')
