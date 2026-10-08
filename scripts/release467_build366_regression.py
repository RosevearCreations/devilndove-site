#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p):return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build366-content-adoption-discovery-outcomes-renewal-xi.json');prev=j('release467-build365-maker-story-advancement-publication-readiness-continuity-viii.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build366_outcomes_measurement.sql');verify=t('scripts/release467_build366_verify_measurement.mjs');wf=t('.github/workflows/release467-build366-content-adoption-discovery-outcomes-renewal-xi.yml')
legacy=t('functions/api/admin/_siteItemInventoryLegacy.js');receiving=t('functions/api/_lib/inventoryReceiving.js')
road=t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_361_366.md')
rel=t('functions/api/_lib/currentReliability.js');pre=t('functions/api/admin/current-deployment-preflight.js');it=t('functions/api/admin/it-operations-control-tower.js')
q(a.get('build')==366 and a.get('title')=='Content Adoption & Discovery Outcomes Renewal XI','Build 366 identity mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 365 Production closure not successor-ingested')
fc=prev.get('final_closure') or {};pc=prev.get('production_checkpoint') or {}
q(fc.get('dev_sha')=='5e12ea170eaec46c1d64d5e7d53772417fc31ab6' and fc.get('tree_sha')=='3106fd7364176d9eeb07ce76ed3a60bb6f25d62e','Build 365 exact Development closure missing')
q(pc.get('main_sha')=='712011d85d54ae3183b455bcbc7a55082dc46528' and pc.get('tree_sha')=='3106fd7364176d9eeb07ce76ed3a60bb6f25d62e' and pc.get('state')=='PRODUCTION_GREEN','Build 365 Production checkpoint missing')
scope=a.get('scope') or {}
for key in ('full_path_remeasurement','build360_comparison','build365_readiness_context','maker_story_coverage','review_state','publication','discovery','runtime','identity_integrity','d1_read_outcomes','seo_review_queue_continuity','search_console_freshness_rule','explicit_report_date_only_for_search_console_freshness','next_roadmap_from_observed_evidence_only','raw_inventory_identity_integrity','raw_inventory_one_operational_record_per_active_source_identity','raw_inventory_receiving_adds_to_existing_on_hand','raw_inventory_purchase_lots_preserve_receipt_provenance_separately'):
    q(scope.get(key) is True,'Build 366 scope missing '+key)
q(all(v is False for v in (a.get('safety') or {}).values()),'Build 366 safety boundary drift')
policy=a.get('inventory_identity_policy') or {}
q(policy.get('duplicate_active_identity_allowed') is False,'Raw Inventory duplicate-active policy must be false')
q(policy.get('repeated_receipt_behavior')=='UPDATE_EXISTING_ON_HAND_QUANTITY','Raw Inventory repeated receipt policy mismatch')
q(policy.get('purchase_lot_behavior')=='SEPARATE_PROVENANCE_ROWS_LINKED_TO_ONE_SITE_ITEM_INVENTORY_RECORD','Raw Inventory purchase-lot policy mismatch')
upper=' '+re.sub(r'--.*','',sql).upper()+' '
for forbidden in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(forbidden not in upper,'Build 366 measurement must remain read-only: '+forbidden.strip())
for token in ('Raw Inventory one-record identity','duplicate_active_inventory_identities','inventory_purchase_lots','report_date IS NOT NULL',"date(report_date)>=date('now','-30 days')"):q(token in sql,'Build 366 SQL missing '+token)
for token in ('sets.length!==19','raw_inventory_identity:inventory','Raw Inventory duplicate active identity drift','raw_inventory_one_record_policy_verified','comparison_to_build360','build365','production_d1_contact:false'):q(token in verify,'Build 366 verifier missing '+token)
for token in ("code: 'inventory_identity_exists'","newOnHand = previousOnHand + qty","UPDATE site_item_inventory"):q(token in legacy,'Raw Inventory one-record source contract missing '+token)
for token in ('inventory_purchase_lots','idempotent_replay'):q(token in receiving,'Inventory receiving provenance contract missing '+token)
cur=int(p.get('build') or 0)
triggers=('push:','branches: [dev]') if cur==366 else ('workflow_dispatch:',)
for token in (*triggers,'D1_ONE_SHOT_EVIDENCE_CAPTURE','ROADMAP RENEWAL: OBSERVED EVIDENCE ONLY','RAW INVENTORY ACTIVE IDENTITY DUPLICATES: MUST BE ZERO','REPEATED RECEIPT: ADD QUANTITY TO EXISTING INVENTORY RECORD','PURCHASE LOTS: PROVENANCE, NOT DUPLICATE INVENTORY','BUSINESS DATA MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO'):q(token in wf,'Build 366 workflow boundary missing '+token)
q('Build 366 — Content Adoption & Discovery Outcomes Renewal XI' in road,'Build 366 roadmap entry missing')
q(cur>=366,'Current pointer must retain Build 366 or successor')
if cur==366:q(p.get('state')=='DEVELOPMENT_GREEN' and int(p.get('next_build') or 0)==367 and str(p.get('promotion_state') or '').endswith('_CANDIDATE_NOT_YET_VERIFIED'),'Build 366 current authority governance mismatch')
for text,name in ((rel,'Reliability'),(pre,'Preflight'),(it,'I.T.')):q('366' in text and 'Content Adoption & Discovery Outcomes Renewal XI' in text,name+' current Build 366 identity missing')
for path in ('scripts/release467_build366_verify_measurement.mjs','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/admin/_siteItemInventoryLegacy.js','functions/api/_lib/inventoryReceiving.js'):
    r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    q(r.returncode==0,path+' syntax failed: '+(r.stderr or r.stdout)[-1400:])
print('RELEASE 467 BUILD 366 CONTENT ADOPTION & DISCOVERY OUTCOMES RENEWAL XI')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Roadmap renewal remains observed-evidence-only; Raw Inventory keeps one active operational identity.')
