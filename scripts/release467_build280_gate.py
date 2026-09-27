#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build280-private-media-reconciliation-recovery-outcome-review.json')
prev=j('release467-build279-multipart-interruption-resume-acceptance-drill.json')
b267=j('release467-build267-caip-duplicate-orphan-recovery-classification.json')
b269=j('release467-build269-private-raw-media-intake-integrity.json')
b270=j('release467-build270-strong-fingerprint-backfill-recovery-reconciliation.json')
p=j('current-development-authority.json')
doc=t('docs/operations/RELEASE_467_BUILD_280_PRIVATE_MEDIA_RECONCILIATION_RECOVERY_OUTCOME_REVIEW.md')
road=t('docs/operations/RELEASE_467_CAIP_PRODUCTION_ACCEPTANCE_AUTONOMOUS_BUILDS_276_284.md')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==280 and a.get('title')=='Private-Media Reconciliation & Recovery Outcome Review','Build 280 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 280 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='16cf66164f95d8716da9d61d89833012a5efe2c1' and pred.get('development_tree_sha')=='1c4d9091146915574bac1bc3466bab44e2347269','Build 279 Development predecessor mismatch')
q(pred.get('production_main_sha')=='048c67562efc20892cf9652841edd6b0b1a845d6' and pred.get('production_tree_sha')=='1c4d9091146915574bac1bc3466bab44e2347269' and pred.get('same_tree') is True,'Build 279 Production predecessor mismatch')
dp=pred.get('development_proofs') or {};pp=pred.get('production_proofs') or {}
q(dp.get('system_gate_run')==36249725505 and dp.get('current_application_quality_run')==36249725434 and dp.get('it_admin_runtime_proof_run')==36249725489 and dp.get('branch_hygiene_run')==36249725470 and dp.get('dedicated_gate_run')==36249725485,'Build 279 Development proof mismatch')
q(pp.get('production_pages_deploy_run')==36249900945 and pp.get('production_live_resource_integrity_run')==36249947458 and pp.get('products_browser_proof_run')==36249947466 and pp.get('products_route_proof_run')==36249947674 and pp.get('build_specific_proof_run')==36249900929,'Build 279 Production proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 279 successor-ingested authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='16cf66164f95d8716da9d61d89833012a5efe2c1' and (prev.get('final_closure') or {}).get('tree_sha')=='1c4d9091146915574bac1bc3466bab44e2347269','Build 279 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='048c67562efc20892cf9652841edd6b0b1a845d6' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='1c4d9091146915574bac1bc3466bab44e2347269','Build 279 Production checkpoint missing')
r=a.get('outcome_review') or {}
q(r.get('current_lane_state')=='ACCEPTED' and (r.get('build279_acceptance') or {}).get('fresh_dimensions')=='3/3','Build 280 must retain Build 279 3/3 ACCEPTED outcome')
sf=r.get('strong_fingerprint_backfill') or {}
q(sf.get('version')=='sample_sha256_v1' and sf.get('max_rows_per_request')==20 and sf.get('operator_default_rows')==8 and sf.get('exact_r2_head_size_before_metadata_repair') is True,'Strong-fingerprint bounded reconciliation drift')
dup=r.get('duplicate_and_orphan_classification') or {}
q(dup.get('strong_duplicate_identity')=='same_project + content_fingerprint + exact_size' and dup.get('binary_equivalence_requires_verified_equal_checksums') is True and dup.get('cleanup_inferred_from_classification') is False,'Duplicate classification outcome drift')
rec=r.get('recovery_integrity') or {}
q(rec.get('recovery_lineage_preserved') is True and rec.get('integrity_failed_binary_preserved') is True and rec.get('completed_raw_original_immutable') is True and rec.get('uncertain_binary_preserved') is True,'Recovery preservation outcome drift')
q(b267.get('state')=='PRODUCTION_GREEN' and (b267.get('classification') or {}).get('uncertain_r2_delete_authorized') is False,'Build 267 classification authority drift')
q(b269.get('state')=='PRODUCTION_GREEN' and (b269.get('safety') or {}).get('uncertain_r2_delete') is False,'Build 269 intake integrity authority drift')
q(b270.get('state')=='PRODUCTION_GREEN' and (b270.get('reconciliation') or {}).get('automatic_r2_delete') is False and (b270.get('reconciliation') or {}).get('uncertain_binary_preserved') is True,'Build 270 reconciliation authority drift')
for token in ('Build 280 — Private-Media Reconciliation & Recovery Outcome Review','Build 281 — Standalone / Social Project Operator Acceptance'):q(token in road,f'Roadmap missing {token}')
for token in ('3/3 / ACCEPTED','sample_sha256_v1','classification alone never authorizes physical cleanup','uncertain binaries remain preserved','Build 281'):q(token in doc,f'Build 280 document missing {token}')
q("run_current_contract('scripts/release467_build280_gate.py','Release 467 Build 280')" in sysgate,'System Gate missing Build 280')
cur=int(p.get('build') or 0);q(p.get('release')==467 and cur>=280,'Current authority must retain Build 280 or successor')
if cur==280:
    q(p.get('title')=='Private-Media Reconciliation & Recovery Outcome Review' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 280 pointer mismatch')
    q(p.get('accepted_dev_sha')=='16cf66164f95d8716da9d61d89833012a5efe2c1' and p.get('accepted_dev_tree_sha')=='1c4d9091146915574bac1bc3466bab44e2347269','Current Build 280 accepted predecessor mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='048c67562efc20892cf9652841edd6b0b1a845d6','Current Build 280 Production predecessor mismatch')
    q(int(p.get('next_build') or 0)==281,'Current Build 280 successor pointer mismatch')
s=a.get('safety') or {}
for k,v in s.items():q(v is False,f'Build 280 safety drift: {k}')
print('RELEASE 467 BUILD 280 PRIVATE-MEDIA RECONCILIATION & RECOVERY OUTCOME REVIEW')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('CAIP private-media lane: ACCEPTED; reconciliation/recovery review remains fail-closed and non-destructive.')
print('Next: Build 281 — Standalone / Social Project Operator Acceptance')
