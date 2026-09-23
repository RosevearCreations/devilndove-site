#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def text(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(text(path))

a=load('release467-build234-workflow-help-empty-state-recovery.json')
p=load('current-development-authority.json')
prev=load('release467-build233-universal-help-quality-of-life-coverage.json')
manifest=load('migrations/canonical/manifest.json')
h=text('public/js/admin-context-help.js')
adm=text('admin/help/index.html')
pack=text('public/js/admin-packaging-studio.js')
pack_html=text('admin/packaging-studio/index.html')
domain=text('functions/api/_lib/packagingDomainService.js')
readsvc=text('functions/api/_lib/packagingReadService.js')
mig=text('migrations/canonical/0023_release467_cupcake_soap_label_templates.sql')
road=text('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
doc=text('docs/operations/RELEASE_467_BUILD_234_WORKFLOW_HELP_EMPTY_STATE_RECOVERY.md')
sysgate=text('scripts/current_system_gate_provenance_gate.py')
mid=text('functions/_middleware.js')
auth=text('public/js/site-auth-ui.js')

req(a.get('build')==234 and a.get('title')=='Workflow Help, Empty States & Recovery Guidance','Build 234 authority identity')
req(a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 234 authority state')
pred=a.get('predecessor') or {}
req(pred.get('development_sha')=='c9882fef84e23f7416a7042f52ec8b5ea151287f' and pred.get('development_tree_sha')=='6eef4a4edf79d5ce367b052823bede7d9a665465','Build 234 Development predecessor drifted')
req(pred.get('production_main_sha')=='8de67c8e5a0e9fe745264a387f749c0cd8a4c6ad' and pred.get('production_tree_sha')=='6eef4a4edf79d5ce367b052823bede7d9a665465','Build 234 Production predecessor drifted')
req(prev.get('state')=='PRODUCTION_GREEN','Build 233 must be finalized Production GREEN')
pb=int(p.get('build') or 0); last=(p.get('restart_integrity') or {}).get('last_fully_verified',{})
req((pb==234 and p.get('title')=='Workflow Help, Empty States & Recovery Guidance') or (pb>=235 and 'release467-build234-workflow-help-empty-state-recovery.json' in (p.get('current_release_authorities') or [])),'Build 234 must remain represented in the current successor chain')
req((pb==234 and p.get('accepted_dev_sha')=='c9882fef84e23f7416a7042f52ec8b5ea151287f' and p.get('accepted_dev_tree_sha')=='6eef4a4edf79d5ce367b052823bede7d9a665465') or (pb>=235 and int(last.get('build') or 0)>=234),'Build 234 predecessor/closure checkpoint must remain represented')
req((pb==234 and int(last.get('build') or 0)==233) or (pb>=235 and int(last.get('build') or 0)>=234),'Build 234 verified successor provenance missing')
req(((pb==234 and (p.get('planned_successor') or {}).get('next_build')==235) or pb>=235) and (p.get('planned_successor') or {}).get('future_queue_exhausted') is False,'Build 235+ successor queue must remain open')

for token in ('DD_WORKFLOW_HELP_PROFILES','workflowHelpProfile(path)','Start —','Work —','Review —','Finish —','Empty / first use','Broken / recovery','Why can’t I do this?','ensureActionRecoveryHelp(path, ordinal)'):
    req(token in h,f'workflow help missing {token}')
req(h.count('ordinal = ensurePageLevelHelp(path, ordinal);')==1,'page-level help must have one refresh invocation')
refresh=re.search(r'function refresh\(\) \{([\s\S]*?)\n\}',h)
req(bool(refresh) and 'ordinal = ensurePageLevelHelp(path, ordinal);' in refresh.group(1) and 'ensureActionRecoveryHelp(path, ordinal)' in refresh.group(1),'page/action help must execute inside refresh()')
req('fetch(' not in h and 'apiFetch' not in h,'shared help must remain client-only/read-only')
req('/public/js/admin-context-help.js?v=467b234-workflow-help' in mid and '/public/js/admin-context-help.js?v=467b234-workflow-help' in auth,'Build 234 help runtime revision not active')
for token in ('Start → Work → Review → Finish','Empty state versus broken state','Why can’t I do this?'):
    req(token in adm,f'Creator Help Centre missing {token}')

for token in ('soap_cupcake_label','cupcake_soap_square','cupcakeSoapLabelSvg','CUPCAKE_LABEL_PRESETS','CUPCAKE_COLOUR_PRESETS','packagingCupcakeLabelTitle','packagingCupcakePurpose','createCupcakeProject','newCupcakeSoapLabel'):
    req(token in (pack+pack_html),f'cupcake label implementation missing {token}')
for key in ('soap-cupcake-sweet-orange-2in-v1','soap-cupcake-charcoal-2in-v1','soap-cupcake-oatmeal-goat-milk-2in-v1','soap-cupcake-sea-breeze-2in-v1','soap-cupcake-lavender-dream-2in-v1'):
    req(key in mig,f'cupcake migration missing {key}')
req(mig.count('50.8,50.8')>=5,'all five cupcake templates must be exact 50.8 × 50.8 mm')
for colour in ('berry-pink','mint-cream','lemon-cream','honey-amber','rose-cream','peach-cream','blueberry-cream','vanilla-gold','teal-cream','copper-cream'):
    req(colour in pack,f'additional cupcake colour missing {colour}')
req("SOAP_PACKAGE_TYPES = new Set(['soap_ribbon','soap_cupcake_label'])" in domain,'Packaging domain must treat cupcake labels as soap records')
req("'soap_cupcake_label'" in domain and "'cupcake_soap_square'" in domain,'Packaging domain cupcake type/profile missing')
req("packageType === 'soap_cupcake_label'" in readsvc and '50.8' in readsvc and 'companion/back/extended label' in readsvc,'Packaging preflight cupcake compact-label boundary missing')
req('Create 2 × 2 cupcake-soap label' in pack_html,'Packaging Studio cupcake creation action missing')

files=[str(row.get('file') or '') for row in (manifest.get('migrations') or []) if isinstance(row,dict)]
req(len(files)==23,'Build 234 canonical migration stream must contain exactly 23 migrations')
req(files[-1]=='0023_release467_cupcake_soap_label_templates.sql','Build 234 canonical migration 0023 identity')
req((a.get('safety') or {}).get('data_only_forward_migration') is True and (a.get('safety') or {}).get('canonical_schema_addition') is False,'Build 234 migration must remain data-only')
for key in ('product_mutation','inventory_quantity_mutation','finance_mutation','r2_mutation','provider_execution','provider_publication','automatic_product_publication','help_api_calls'):
    req((a.get('safety') or {}).get(key) is False,f'Build 234 safety boundary drifted: {key}')
req('Build 235 — Resume Work & Cross-Workspace Handoff' in road and 'Build 248 — Refinement Outcomes Review & Roadmap Renewal' in road,'refinement successor roadmap incomplete')
req('future queue is not exhausted' in doc.lower(),'Build 234 operations doc must keep future queue open')
req("run_current_contract('scripts/release467_build233_gate.py','Release 467 Build 233')" in sysgate,'System Gate must retain Build 233')
req("run_current_contract('scripts/release467_build234_gate.py','Release 467 Build 234')" in sysgate,'System Gate must invoke Build 234')

print('RELEASE 467 BUILD 234 WORKFLOW HELP EMPTY STATES RECOVERY + SOAP CUPCAKE LABELS')
if FAIL:
    for i,x in enumerate(FAIL,1): print(f'{i:03d}. FAIL — {x}')
    sys.exit(1)
print('RELEASE 467 BUILD 234 WORKFLOW HELP EMPTY STATES RECOVERY + SOAP CUPCAKE LABELS: PASS')
print('Next build: 235 — Resume Work & Cross-Workspace Handoff')
print('Future queue exhausted: NO')
