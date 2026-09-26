#!/usr/bin/env python3
from pathlib import Path
import json,sys
R=Path(__file__).resolve().parents[1];F=[]
def t(p): return (R/p).read_text(encoding='utf-8',errors='replace')
def j(p): return json.loads(t(p))
def q(ok,msg):
    if not ok:F.append(msg)
a=j('release467-build279-multipart-interruption-resume-acceptance-drill.json')
prev=j('release467-build278-authenticated-private-review-range-streaming-acceptance-refresh.json')
p=j('current-development-authority.json')
doc=t('docs/operations/RELEASE_467_BUILD_279_MULTIPART_INTERRUPTION_RESUME_ACCEPTANCE_DRILL.md')
road=t('docs/operations/RELEASE_467_CAIP_PRODUCTION_ACCEPTANCE_AUTONOMOUS_BUILDS_276_284.md')
wf=t('.github/workflows/release467-build279-multipart-interruption-resume-acceptance-drill.yml')
ops=t('functions/api/_lib/caipMediaIntake.js')
part=t('functions/api/admin/caip-media-upload-part.js')
sysgate=t('scripts/current_system_gate_provenance_gate.py')
q(a.get('build')==279 and a.get('title')=='Multipart Interruption & Resume Acceptance Drill','Build 279 identity mismatch')
q(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 279 state mismatch')
pred=a.get('predecessor') or {}
q(pred.get('development_sha')=='4a96fba89316d287771d34ef278b2404848e2996' and pred.get('development_tree_sha')=='b7ad133e79cd01a30d2056f77ffd069996560cf6','Build 278 Development predecessor mismatch')
q(pred.get('production_main_sha')=='5d418eb1160caa7af855a247e1ff3510e4c1c9b8' and pred.get('production_tree_sha')=='b7ad133e79cd01a30d2056f77ffd069996560cf6' and pred.get('same_tree') is True,'Build 278 Production predecessor mismatch')
dp=pred.get('development_proofs') or {};pp=pred.get('production_proofs') or {}
q(dp.get('system_gate_run')==36247952924 and dp.get('current_application_quality_run')==36247952893 and dp.get('it_admin_runtime_proof_run')==36247952964 and dp.get('branch_hygiene_run')==36247953198 and dp.get('dedicated_gate_run')==36247952942,'Build 278 Development proof mismatch')
q(pp.get('production_pages_deploy_run')==36248115089 and pp.get('production_live_resource_integrity_run')==36248156311 and pp.get('products_browser_proof_run')==36248156279 and pp.get('products_route_proof_run')==36248156316 and pp.get('build_specific_proof_run')==36248115177,'Build 278 Production proof mismatch')
q(prev.get('state')=='PRODUCTION_GREEN','Build 278 successor-ingested authority must be Production GREEN')
q((prev.get('final_closure') or {}).get('dev_sha')=='4a96fba89316d287771d34ef278b2404848e2996' and (prev.get('final_closure') or {}).get('tree_sha')=='b7ad133e79cd01a30d2056f77ffd069996560cf6','Build 278 final Development closure missing')
q((prev.get('production_checkpoint') or {}).get('main_sha')=='5d418eb1160caa7af855a247e1ff3510e4c1c9b8' and (prev.get('production_checkpoint') or {}).get('tree_sha')=='b7ad133e79cd01a30d2056f77ffd069996560cf6','Build 278 Production checkpoint missing')
e=a.get('evidence_contract') or {}
q(e.get('dimension')=='multipart_interruption_reconnect_reselection_resume' and e.get('environment')=='DEVELOPMENT_EXACT_SHA_LIVE_MULTIPART_DRILL','Build 279 evidence dimension/environment mismatch')
q(e.get('live_runtime_required') is True and e.get('static_source_is_live_acceptance') is False,'Build 279 must require a real live drill')
q(e.get('fixture_policy')=='DETERMINISTIC_NON_PRODUCTION_MEDIA_DRILL_FIXTURE' and e.get('production_media_copy') is False,'Build 279 fixture boundary drift')
q(e.get('fixture_size_bytes')==100663296 and e.get('part_size_bytes')==33554432 and e.get('expected_parts')==3,'Build 279 multipart drill geometry drift')
q(e.get('interruption_after_uploaded_parts')==1 and e.get('resume_uploads_additional_parts')==1 and e.get('deliberately_missing_completion_part')==3,'Build 279 interruption/completion contract drift')
guard=e.get('completion_guard') or {};clean=e.get('cleanup') or {}
q(guard.get('expected_error_marker')=='[CAIP_MULTIPART_INCOMPLETE]' and guard.get('missing_part_blocks_r2_complete') is True,'Build 279 fail-closed completion contract drift')
q(clean.get('abort_exact_active_multipart_after_evidence') is True and clean.get('finalized_raw_object') is False and clean.get('production_r2_contact') is False,'Build 279 cleanup contract drift')
q(e.get('fresh_dimensions_before_runtime_green')==2 and e.get('fresh_dimensions_after_runtime_green')==3 and e.get('required_dimensions_total')==3 and e.get('overall_lane_after_runtime_green')=='ACCEPTED','Build 279 acceptance interpretation drift')
for token in ('Build 279 — Multipart Interruption & Resume Acceptance Drill','Build 280 — Private-Media Reconciliation & Recovery Outcome Review'): q(token in road,f'Roadmap missing {token}')
for token in ('96 MiB','resume_existing','[CAIP_MULTIPART_INCOMPLETE]','3/3','Build 280'): q(token in doc,f'Build 279 document missing {token}')
for token in ('DND_DEV_SESSION_COOKIE','create_session','resume_existing','resumed_existing_upload','caip-media-upload-part','[CAIP_MULTIPART_INCOMPLETE]','abort_file','build279-multipart-interruption-resume-evidence'): q(token in wf,f'Build 279 workflow missing {token}')
for token in ("CAIP_MEDIA_INTAKE_BUILD = 'Build 279'","action:'resume_existing'","resumeMultipartUpload","uploaded.length===expectedParts","[CAIP_MULTIPART_INCOMPLETE]","upload.abort()"): q(token in ops,f'Build 279 runtime invariant missing: {token}')
for token in ('resumeMultipartUpload','uploadPart','already_uploaded'): q(token in part,f'Build 279 part-route invariant missing: {token}')
q("run_current_contract('scripts/release467_build279_gate.py','Release 467 Build 279')" in sysgate,'System Gate missing Build 279')
cur=int(p.get('build') or 0);q(p.get('release')==467 and cur>=279,'Current authority must retain Build 279 or successor')
if cur==279:
    q(p.get('title')=='Multipart Interruption & Resume Acceptance Drill' and p.get('state')=='DEVELOPMENT_GREEN','Current Build 279 pointer mismatch')
    q(p.get('accepted_dev_sha')=='4a96fba89316d287771d34ef278b2404848e2996' and p.get('accepted_dev_tree_sha')=='b7ad133e79cd01a30d2056f77ffd069996560cf6','Current Build 279 accepted predecessor mismatch')
    q((p.get('production_checkpoint') or {}).get('main_sha')=='5d418eb1160caa7af855a247e1ff3510e4c1c9b8','Current Build 279 Production predecessor mismatch')
    q(int(p.get('next_build') or 0)==280,'Current Build 279 successor pointer mismatch')
s=a.get('safety') or {}
for k in ('schema_change','request_time_schema_mutation','production_d1_business_data_mutation','production_r2_mutation','production_private_media_upload','production_media_copy','finalized_drill_object_retained','private_media_delete','uncertain_r2_delete','public_media_copy','provider_execution','provider_publication','product_publication','inventory_movement','finance_posting','payment_or_refund','production_business_data_copy','secret_capture','raw_r2_identity_capture','raw_etag_capture','synthetic_acceptance','exact_sha_requirement_relaxed','named_proof_requirement_relaxed'):
    q(s.get(k) is False,f'Build 279 safety drift: {k}')
q(s.get('development_private_media_multipart_drill') is True,'Build 279 bounded Development drill must be explicit')
print('RELEASE 467 BUILD 279 MULTIPART INTERRUPTION RESUME ACCEPTANCE DRILL')
if F:
    print('FAIL');[print('-',x) for x in F];sys.exit(1)
print('PASS')
print('Runtime GREEN target: current-release CAIP acceptance 3/3 and ACCEPTED; source commit does not self-claim runtime success.')
print('Next: Build 280 — Private-Media Reconciliation & Recovery Outcome Review')
