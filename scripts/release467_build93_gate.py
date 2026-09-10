#!/usr/bin/env python3
"""Fail-closed source/runtime contract for Release 467 Build 93."""
from pathlib import Path
import json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
B92_SHA='67bca9198c0973ffe2b39818c3b933ec2737cc00'; B92_TREE='f3fa062060cd53eb5e4b7dab42b2ba6d1fae0450'
B92_PROOFS={'system_gate_run':34506095955,'current_application_quality_run':34506095848,'it_admin_runtime_proof_run':34506095837,'branch_hygiene_run':34506095835}
B92_PAGES=34506354596; B92_LIVE=34506453451
EXPECTED=['0001_release464_migration_authority.sql','0002_release464_operational_acceptance.sql','0003_release464_business_growth.sql','0004_release465_storefront_quality.sql']
def read(p):
 t=ROOT/p
 if not t.is_file():FAIL.append(f'missing required file: {p}');return ''
 return t.read_text(encoding='utf-8',errors='replace')
def load(p):
 try:return json.loads(read(p) or '{}')
 except json.JSONDecodeError as e:FAIL.append(f'invalid JSON {p}: {e}');return{}
def req(ok,msg):
 if not ok:FAIL.append(msg)
def run(cmd,label):
 r=subprocess.run(cmd,cwd=ROOT,text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
 if r.stdout.strip():print(r.stdout.strip())
 req(r.returncode==0,f"{label} failed: {(r.stderr or r.stdout).strip()[-3600:]}")
def compact(s):return re.sub(r'\s+','',s)

pointer=load('current-development-authority.json'); b92=load('release467-build92-prelaunch-action-queue-completeness.json'); b93=load('release467-build93-centered-application-shell-overflow-accessibility.json'); manifest=load('migrations/canonical/manifest.json')
css=read('css/current-responsive.css'); cssc=compact(css); layout=read('public/js/layout-overflow-guard.js'); middleware=read('functions/_middleware.js')
it_api=read('functions/api/admin/it-operations-control-tower.js'); it_client=read('public/js/admin-it-control-tower.js'); it_page=read('admin/it/index.html')
reliability=read('functions/api/_lib/currentReliability.js'); reliability_page=read('admin/reliability/index.html')
preflight=read('functions/api/admin/current-deployment-preflight.js'); preflight_page=read('admin/deployment-preflight/index.html')
doc=read('docs/operations/RELEASE_467_BUILD_93_CENTERED_APPLICATION_SHELL_OVERFLOW_ACCESSIBILITY.md'); provenance=read('scripts/current_system_gate_provenance_gate.py')

req(pointer.get('release')==467 and pointer.get('build')==93,'current authority must be Release 467 Build 93')
req(pointer.get('title')=='Centered Application Shell & Overflow Accessibility','Build 93 title drifted')
req(pointer.get('state')=='DEVELOPMENT_GREEN','candidate pointer must retain last externally verified Development GREEN state')
req(pointer.get('accepted_dev_sha')==B92_SHA and pointer.get('accepted_dev_tree_sha')==B92_TREE,'Build 93 accepted Development SHA/tree must equal Build 92 closure')
req((pointer.get('acceptance') or {})==B92_PROOFS,'Build 93 accepted Development proof set must equal Build 92')
req(pointer.get('promotion_state')=='BUILD93_CANDIDATE_NOT_YET_VERIFIED','Build 93 promotion state must remain fail-closed candidate')
restart=pointer.get('restart_integrity') or {}; last=restart.get('last_fully_verified') or {}; cand=restart.get('current_closure_candidate') or {}; prod=pointer.get('production_checkpoint') or {}
req(last.get('build')==92 and last.get('dev_sha')==B92_SHA and last.get('tree_sha')==B92_TREE and (last.get('proofs') or {})==B92_PROOFS,'Build 92 restart closure drifted')
req(cand.get('build')==93 and cand.get('authority')=='release467-build93-centered-application-shell-overflow-accessibility.json' and cand.get('state')=='AWAITING_EXTERNAL_EXACT_CLOSURE_HEAD_PROOF','Build 93 closure-candidate pointer drifted')
req(prod.get('build')==92 and prod.get('main_sha')==B92_SHA and prod.get('tree_sha')==B92_TREE and prod.get('production_pages_deploy_run')==B92_PAGES and prod.get('production_live_resource_integrity_run')==B92_LIVE,'Build 92 Production baseline drifted')
for k in ('schema_change_authorized','d1_mutation_authorized','r2_mutation_authorized','provider_execution_authorized','provider_publication_authorized','cloudflare_access_mutation_authorized','automatic_production_promotion_authorized','request_time_schema_mutation','secret_values_emitted'):req(pointer.get(k) is False,f'unsafe pointer flag must remain false: {k}')

req(b92.get('state')=='PRODUCTION_GREEN','Build 92 authority must retain Production GREEN')
f=b92.get('final_closure') or {}; p92=b92.get('production_checkpoint') or {}
req(f.get('dev_sha')==B92_SHA and f.get('tree_sha')==B92_TREE and (f.get('proofs') or {})==B92_PROOFS,'Build 92 final closure drifted')
req(p92.get('main_sha')==B92_SHA and p92.get('tree_sha')==B92_TREE and p92.get('production_pages_deploy_run')==B92_PAGES and p92.get('production_live_resource_integrity_run')==B92_LIVE,'Build 92 Production closure drifted')
req(b93.get('release')==467 and b93.get('build')==93 and b93.get('title')=='Centered Application Shell & Overflow Accessibility','Build 93 authority identity drifted')
req(b93.get('state')=='DEVELOPMENT_CLOSURE_CANDIDATE','Build 93 authority must remain closure candidate')
sd=(b93.get('starting_point') or {}).get('development') or {}; sp=(b93.get('starting_point') or {}).get('production') or {}
req(sd.get('sha')==B92_SHA and sd.get('tree')==B92_TREE and sd.get('system_gate_run')==B92_PROOFS['system_gate_run'] and sd.get('quality_run')==B92_PROOFS['current_application_quality_run'] and sd.get('it_admin_runtime_run')==B92_PROOFS['it_admin_runtime_proof_run'] and sd.get('repository_hygiene_run')==B92_PROOFS['branch_hygiene_run'],'Build 93 Development starting point drifted')
req(sp.get('main_sha')==B92_SHA and sp.get('tree_sha')==B92_TREE and sp.get('production_pages_deploy_run')==B92_PAGES and sp.get('production_live_resource_integrity_run')==B92_LIVE,'Build 93 Production starting point drifted')
req((b93.get('closure_policy') or {}).get('final_closure') is None,'Build 93 must not contain premature final closure')

# Shared layout must center shells and preserve access to overflow instead of clipping it.
req('overflow-x:clip' not in cssc,'responsive CSS must not clip horizontal content at the root')
for token in ('html{box-sizing:border-box','overflow-x:auto','.container,.admin-shell{width:100%;margin-inline:auto!important}', '.dd-centered-shell', '.dd-horizontal-scroll-region','overflow-x:auto!important','max-width:100%','overflow-wrap:anywhere'):
 req(token in cssc,f'Build 93 responsive CSS missing: {token}')
req('.admin-shell.card{overflow:hidden}' not in cssc,'Build 93 responsive layer must not reintroduce hidden admin-card overflow')
for token in ('centerShells','normalizeScrollRegion','dd-horizontal-scroll-region','tabindex','MutationObserver','dd-table-scroll'):
 req(token in layout,f'Build 93 layout guard missing token: {token}')
req('h1' not in layout.lower(),'layout guard must not mutate heading hierarchy')
req('/css/current-responsive.css?v=current' in middleware and '/public/js/layout-overflow-guard.js?v=current' in middleware,'global middleware responsive injection drifted')

# Current operator surfaces use Build 93 over exact Build 92 closure.
for text,label in ((it_api,'I.T. API'),(reliability,'Reliability'),(preflight,'Deployment Preflight')):
 req(B92_SHA in text and B92_TREE in text,f'{label} missing Build 92 verified SHA/tree'); req(str(B92_PAGES) in text and str(B92_LIVE) in text,f'{label} missing Build 92 Production proof')
req('constBUILD=93;' in compact(it_api),'I.T. API must identify Build 93')
req('CURRENT_RELIABILITY_BUILD = 93' in reliability,'Reliability must identify Build 93')
req('constBUILD=93;' in compact(preflight),'Deployment Preflight must identify Build 93')
req('Release 467 Build 93' in it_client and 'Release 467 Build 93' in it_page,'I.T. current surfaces must identify Build 93')
req('Release 467 • Build 93' in reliability_page,'Reliability page must identify Build 93')
req('Release 467 Build 93' in preflight_page,'Deployment Preflight page must identify Build 93')
for page,label in ((it_page,'I.T.'),(reliability_page,'Reliability'),(preflight_page,'Deployment Preflight')):
 req(len(re.findall(r'<h1(?:\s|>)',page,re.I))==1,f'{label} page must contain exactly one H1')
 req('current-responsive.css' in page,f'{label} page must explicitly load current responsive CSS')

scope=b93.get('scope') or {}; acceptance=b93.get('acceptance') or {}
for key in ('center_public_application_shells','center_admin_application_shells','remove_root_horizontal_clipping','preserve_horizontal_reachability','contain_wide_data_regions_locally','keep_tables_scrollable_inside_viewport','prevent_grid_children_forcing_page_width','prevent_long_tokens_forcing_page_width','phone_tablet_desktop_wide_screen_supported','one_h1_rule_unchanged','layout_guard_read_only'):
 req(scope.get(key) is True,f'Build 93 scope missing {key}')
for key in ('business_data_change','schema_change','automatic_provider_execution','provider_publication','automatic_production_promotion'):
 req(scope.get(key) is False,f'Build 93 unsafe scope drifted: {key}')
for key in ('shell_margin_inline_auto','shell_width_bounded_to_viewport','html_overflow_x_clip_forbidden','document_horizontal_scroll_remains_recoverable','admin_cards_do_not_permanently_hide_horizontal_data','table_regions_have_local_horizontal_scroll','dynamic_tables_remain_wrapped','responsive_source_gate_extended','build93_source_gate_required'):
 req(acceptance.get(key) is True,f'Build 93 acceptance missing {key}')

for path in ('AI_HANDOFF.md','PROJECT_STATUS_AND_ROADMAP.md','SANITY_HEALTH_CHECK.md','MARKDOWN_INDEX.md','docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'):
 body=read(path)
 for token in (B92_SHA,B92_TREE,str(B92_PROOFS['system_gate_run']),str(B92_PROOFS['current_application_quality_run']),str(B92_PROOFS['it_admin_runtime_proof_run']),str(B92_PROOFS['branch_hygiene_run']),str(B92_PAGES),str(B92_LIVE)):req(token in body,f'{path} missing Build 92 verified token: {token}')
 req('Build 93' in body and 'Centered Application Shell' in body,f'{path} must identify Build 93 current candidate')
for token in ('center','overflow','right-side','keyboard','public','admin','0001','0004','Canada-only','U.S. sales/shipping'):
 req(token.lower() in doc.lower(),f'Build 93 operating document missing token: {token}')
req([r.get('file') for r in manifest.get('migrations',[])]==EXPECTED,'Build 93 must keep canonical migrations exactly 0001-0004')
req(not list((ROOT/'migrations/canonical').glob('0005*')),'Build 93 must remain schema-neutral')
req("run_current_contract('scripts/release467_build93_gate.py', 'Release 467 Build 93')" in provenance,'System Gate does not chain Build 93')

for path in ('public/js/layout-overflow-guard.js','functions/api/admin/it-operations-control-tower.js','public/js/admin-it-control-tower.js','functions/api/_lib/currentReliability.js','functions/api/admin/current-deployment-preflight.js'):
 run(['node','--check',path],f'JavaScript syntax {path}')
run(['python3','scripts/current_responsive_layout_gate.py'],'current responsive layout')
run(['python3','scripts/current_it_release_truth_gate.py'],'current I.T. release truth')
run(['python3','scripts/current_authority_restart_integrity_gate.py'],'current restart integrity')
run(['python3','scripts/current_reliability_truth_gate.py'],'current Reliability truth')
run(['python3','scripts/current_deployment_preflight_truth_gate.py'],'current Deployment Preflight truth')
run(['python3','scripts/release467_build92_gate.py'],'carried Build 92 boundary')
if FAIL:
 print('RELEASE 467 BUILD 93 CENTERED APPLICATION SHELL & OVERFLOW ACCESSIBILITY: FAIL'); [print('-',x) for x in FAIL]; sys.exit(1)
print('RELEASE 467 BUILD 93 CENTERED APPLICATION SHELL & OVERFLOW ACCESSIBILITY: PASS')
print('Public/admin shells: CENTERED / VIEWPORT BOUNDED')
print('Right-side data: REACHABLE / NO ROOT CLIP')
print('Wide data regions: LOCAL KEYBOARD-ACCESSIBLE SCROLL')
print('Canonical D1 migrations: 0001-0004 / UNCHANGED')
