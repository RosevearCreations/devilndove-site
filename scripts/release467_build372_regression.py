#!/usr/bin/env python3
from pathlib import Path
import json,re,subprocess,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p):return (R/p).read_text(encoding='utf-8')
def j(p):return json.loads(t(p))
def q(ok,msg):
 if not ok:F.append(msg)
a=j('release467-build372-content-adoption-discovery-outcomes-renewal-xii.json');prev=j('release467-build371-maker-story-advancement-publication-readiness-continuity-ix.json');p=j('current-development-authority.json')
sql=t('scripts/release467_build372_outcomes_measurement.sql');verify=t('scripts/release467_build372_verify_measurement.mjs');wf=t('.github/workflows/release467-build372-content-adoption-discovery-outcomes-renewal-xii.yml');old=t('.github/workflows/release467-build371-maker-story-advancement-publication-readiness-continuity-ix.yml')
q(a['build']==372 and a['title']=='Content Adoption & Discovery Outcomes Renewal XII','Build 372 identity')
q(prev.get('state')=='PRODUCTION_GREEN','Build 371 predecessor Production GREEN authority')
q((prev.get('final_closure') or {}).get('dev_sha')=='1f34772a0e0576953d9c8184d947fa7cdd8b9beb' and (prev.get('final_closure') or {}).get('tree_sha')=='e19ad27943f3089d84aa943f8dfaec109ef50e65','Build 371 exact development closure')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='eaaac6af5813e4d636188a7ba2f7036d45dacb5f' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='e19ad27943f3089d84aa943f8dfaec109ef50e65','Build 371 exact Production checkpoint')
q(a['predecessor']['development_sha']=='1f34772a0e0576953d9c8184d947fa7cdd8b9beb' and a['predecessor']['production_main_sha']=='eaaac6af5813e4d636188a7ba2f7036d45dacb5f','Build 372 predecessor identity')
for key in ('full_path_remeasurement','build360_comparison','build371_readiness_context','compare_build366','maker_story_coverage','review_state','publication','discovery','runtime','identity_integrity','d1_read_outcomes','raw_inventory_identity_integrity','search_console_freshness_rule','explicit_report_date_only_for_search_console_freshness','next_roadmap_from_observed_evidence_only'):
 q(a['scope'].get(key) is True,'scope '+key)
q(all(v is False for v in a['safety'].values()),'Build 372 safety')
q(a['inventory_identity_policy']['duplicate_active_identity_allowed'] is False,'No duplicate inventory identity')
q(a['inventory_identity_policy']['repeated_receipt_behavior']=='UPDATE_EXISTING_ON_HAND_QUANTITY','Inventory receiving additive')
q('inventory_purchase_lots' in t('functions/api/_lib/inventoryReceiving.js'),'Inventory purchase lots')
upper=' '+re.sub(r'--[^\n]*','',sql).upper()+' '
for term in (' INSERT ',' UPDATE ',' DELETE ',' CREATE ',' ALTER ',' DROP ',' REPLACE ',' VACUUM ',' REINDEX '):q(term not in upper,'Read-only SQL '+term)
for term in ('duplicate_active_inventory_identities','inventory_purchase_lots','report_date IS NOT NULL',"date(report_date)>=date('now','-30 days')",'pragma_foreign_key_check'):
 q(term in sql,'SQL '+term)
for term in ('sets.length!==19','raw_inventory_identity:inventory','comparison_to_build360','production_d1_contact:false','ADOPTION_PROGRESS_OBSERVED','REAL_DISCOVERY_EVIDENCE_OBSERVED'):
 q(term in verify,'Verifier '+term)
for term in ('D1_ONE_SHOT_EVIDENCE_CAPTURE','ROADMAP RENEWAL: OBSERVED EVIDENCE ONLY','RAW INVENTORY ACTIVE IDENTITY DUPLICATES: MUST BE ZERO','BUSINESS DATA MUTATION: ZERO','PRODUCTION D1 CONTACT: ZERO','branches: [dev]'):
 q(term in wf,'Workflow '+term)
q('workflow_dispatch:' in old and 'branches: [dev]' not in old,'Build 371 workflow retired')
q('Build 372 — Content Adoption & Discovery Outcomes Renewal XII' in t('docs/operations/RELEASE_467_EVIDENCE_EXECUTION_DISCOVERY_BUILDS_367_372.md'),'Roadmap predecessor')
q(int(p.get('build') or 0)>=372 and p.get('state')=='DEVELOPMENT_GREEN','Current pointer')
if p.get('build')==372:q(p['next_build']==373 and p['next_build_title']=='Evidence Gap Execution Workbench & Input Completion Continuity VIII' and str(p.get('promotion_state','')).endswith('_CANDIDATE_NOT_YET_VERIFIED'),'Current successor and promotion governance')
for path in ('scripts/release467_build372_verify_measurement.mjs','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js'):
 r=subprocess.run(['node','--check',str(R/path)],cwd=R,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE);q(r.returncode==0,'Syntax '+path+': '+(r.stderr or '')[-500:])
for path in ('functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js','functions/api/admin/it-operations-control-tower.js'):
 q('372' in t(path) and 'Content Adoption & Discovery Outcomes Renewal XII' in t(path),'Current surface '+path)
if F:
 print('RELEASE467_BUILD372_REGRESSION=FAIL');[print('-',x) for x in F];sys.exit(1)
print('RELEASE467_BUILD372_REGRESSION=GREEN')
