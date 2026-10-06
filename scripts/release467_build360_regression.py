#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)

a=j('release467-build360-content-adoption-discovery-outcomes-renewal-x.json')
prev=j('release467-build359-maker-story-advancement-publication-readiness-continuity-vii.json')
p=j('current-development-authority.json')
sql=t('scripts/release467_build360_outcomes_measurement.sql')
verify=t('scripts/release467_build360_verify_measurement.mjs')
wf=t('.github/workflows/release467-build360-content-adoption-discovery-outcomes-renewal-x.yml')
legacy=t('functions/api/admin/_siteItemInventoryLegacy.js')
receiving=t('functions/api/_lib/inventoryReceiving.js')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_355_360.md')

q(a.get('build')==360 and a.get('title')=='Content Adoption & Discovery Outcomes Renewal X','Build 360 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 359 Production closure not successor-ingested')
fc=prev.get('final_closure') or {}; pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='b54800530aad16cf4056506e817aefd7d603d018' and fc.get('tree_sha')=='ae7f5495c3830b9a168184fe596e361538ab31a8','Build 359 exact Development closure missing')
q(pc.get('main_sha')=='8c3461e494398f41e6053616f1cd57a0a2935c65' and pc.get('tree_sha')=='ae7f5495c3830b9a168184fe596e361538ab31a8' and pc.get('state')=='PRODUCTION_GREEN','Build 359 Production checkpoint missing')

scope=a.get('scope') or {}
for key in ('full_path_remeasurement','build354_comparison','build359_readiness_context','maker_story_coverage','review_state','publication','discovery','runtime','identity_integrity','d1_read_outcomes','seo_review_queue_continuity','search_console_freshness_rule','explicit_report_date_only_for_search_console_freshness','next_roadmap_from_observed_evidence_only','raw_inventory_identity_integrity','raw_inventory_one_operational_record_per_active_source_identity','raw_inventory_receiving_adds_to_existing_on_hand','raw_inventory_purchase_lots_preserve_receipt_provenance_separately'):
    q(scope.get(key) is True,'Build 360 scope missing '+key)
q(all(v is False for v in (a.get('safety') or {}).values()),'Build 360 safety boundary drift')

policy=a.get('inventory_identity_policy') or {}
q(policy.get('duplicate_active_identity_allowed') is False,'Raw Inventory duplicate-active policy must be false')
q(policy.get('repeated_receipt_behavior')=='UPDATE_EXISTING_ON_HAND_QUANTITY','Raw Inventory repeated receipt policy mismatch')
q(policy.get('purchase_lot_behavior')=='SEPARATE_PROVENANCE_ROWS_LINKED_TO_ONE_SITE_ITEM_INVENTORY_RECORD','Raw Inventory purchase-lot policy mismatch')

upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):
    q(forbidden not in upper,'Build 360 measurement must remain read-only: '+forbidden.strip())
for token in ('Raw Inventory one-record identity','duplicate_active_inventory_identities','inventory_purchase_lots','report_date IS NOT NULL',"date(report_date)>=date('now','-30 days')"):
    q(token in sql,'Build 360 SQL missing '+token)

for token in ('sets.length!==19','raw_inventory_identity:inventory','Raw Inventory duplicate active identity drift','raw_inventory_one_record_policy_verified','comparison_to_build348','build354','build359','production_d1_contact:false'):
    q(token in verify,'Build 360 verifier missing '+token)

for token in ("code: 'inventory_identity_exists'","newOnHand = previousOnHand + qty","UPDATE site_item_inventory"):
    q(token in legacy,'Raw Inventory one-record source contract missing '+token)
for token in ('inventory_purchase_lots','idempotent_replay'):
    q(token in receiving,'Inventory receiving provenance contract missing '+token)

for token in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','ROADMAP RENEWAL: OBSERVED EVIDENCE ONLY','RAW INVENTORY ACTIVE IDENTITY DUPLICATES: MUST BE ZERO','REPEATED RECEIPT: ADD QUANTITY TO EXISTING INVENTORY RECORD','PURCHASE LOTS: PROVENANCE, NOT DUPLICATE INVENTORY','BUSINESS DATA MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):
    q(token in wf,'Build 360 workflow boundary missing '+token)

q('Build 360 — Content Adoption & Discovery Outcomes Renewal X' in road,'Build 360 roadmap entry missing')
cur=int(p.get('build') or 0); q(cur>=360,'Current pointer must retain Build 360 or successor')
if cur==360:
    q(p.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN'),'Build 360 current state mismatch')
    q(int(p.get('next_build') or 0)==361,'Build 360 current successor placeholder mismatch')

for path in ('scripts/release467_build360_verify_measurement.mjs','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/admin/_siteItemInventoryLegacy.js','functions/api/_lib/inventoryReceiving.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout)[-1400:])

print('RELEASE 467 BUILD 360 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL X')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Raw Inventory contract: one active operational identity; repeated receipts add quantity; purchase lots retain provenance separately.')
