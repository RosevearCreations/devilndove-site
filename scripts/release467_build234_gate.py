#!/usr/bin/env python3
from pathlib import Path
import json,re,sys
ROOT=Path(__file__).resolve().parents[1]; FAIL=[]
def req(ok,msg):
    if not ok: FAIL.append(msg)
def text(path): return (ROOT/path).read_text(encoding='utf-8',errors='replace')
def load(path): return json.loads(text(path))

a=load('release467-build234-workflow-help-empty-states-recovery-guidance.json')
p=load('current-development-authority.json')
pre=load('release467-build233-universal-help-quality-of-life-coverage.json')
m=load('migrations/canonical/manifest.json')
sql=text('migrations/canonical/0023_release467_build234_cupcake_soap_label_templates.sql')
helpjs=text('public/js/admin-context-help.js')
adminhelp=text('admin/help/index.html')
pkg=text('public/js/admin-packaging-studio.js')
pkgserver=text('functions/api/_lib/packagingDomainService.js')
pkgpage=text('admin/packaging-studio/index.html')
pkgdoc=text('docs/packaging/CUPCAKE_SOAP_LABEL_SYSTEM.md')
road=text('docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md')
sysgate=text('scripts/current_system_gate_provenance_gate.py')

req(a.get('build')==234 and a.get('state') in ('DEVELOPMENT_CANDIDATE','DEVELOPMENT_GREEN','PRODUCTION_GREEN'),'Build 234 authority identity/state')
req((a.get('predecessor') or {}).get('development_sha')=='c9882fef84e23f7416a7042f52ec8b5ea151287f','Build 234 predecessor Development SHA')
req((a.get('predecessor') or {}).get('production_main_sha')=='8de67c8e5a0e9fe745264a387f749c0cd8a4c6ad','Build 234 predecessor Production SHA')
req(p.get('build')==234 and p.get('next_build')==234,'current pointer must identify Build 234 candidate')
last=((p.get('restart_integrity') or {}).get('last_fully_verified') or {})
req(last.get('build')==233 and last.get('dev_sha')=='c9882fef84e23f7416a7042f52ec8b5ea151287f','current pointer must ingest exact Build 233 closure')
req((p.get('planned_successor') or {}).get('next_build')==235 and (p.get('planned_successor') or {}).get('future_queue_exhausted') is False,'Build 235 must remain queued')
req((pre.get('production_closure') or {}).get('main_sha')=='8de67c8e5a0e9fe745264a387f749c0cd8a4c6ad','Build 233 retained Production closure missing')

items=m.get('migrations') or []
req(len(items)==23 and items[-1].get('file')=='0023_release467_build234_cupcake_soap_label_templates.sql','canonical migration 0023 must be current')
for token in ('cupcake_soap_square_v1','50.8','cupcake-soap-sweet-orange-2in-v1','cupcake-soap-charcoal-2in-v1','cupcake-soap-oatmeal-goat-milk-2in-v1','cupcake-soap-sea-breeze-2in-v1','cupcake-soap-lavender-dream-2in-v1','cupcake-soap-rose-petal-2in-v1','cupcake-soap-lemon-honey-2in-v1','cupcake-soap-eucalyptus-mint-2in-v1','cupcake-soap-vanilla-cream-2in-v1','cupcake-soap-berry-bliss-2in-v1'):
    req(token in sql,'cupcake migration missing '+token)
req(sql.count("'product_label'")>=10,'all Cupcake templates must use existing product_label package authority')
for forbidden in ('UPDATE products','UPDATE inventory','UPDATE orders','UPDATE customers','DELETE FROM','DROP TABLE','ALTER TABLE'):
    req(forbidden.lower() not in sql.lower(),'cupcake reference migration contains forbidden business/schema mutation: '+forbidden)

for token in ('DD_WORKFLOW_HELP','workflowHelpForPath','Start:','Empty state:','Broken state:','ensureDisabledActionHelp','Why is '):
    req(token in helpjs,'workflow help missing '+token)
req('fetch(' not in helpjs and 'apiFetch' not in helpjs,'shared contextual help must remain client-only')
req('Start → Work → Review → Finish' in adminhelp and 'Empty state ≠ broken state' in adminhelp,'Creator Help Centre recovery guidance missing')
req("ordinal = ensurePageLevelHelp(path, ordinal);" in helpjs and "if (path.startsWith('/admin/')) ordinal = ensureDisabledActionHelp(path, ordinal);" in helpjs,'page/disabled help must run inside shared refresh')

for token in ('CUPCAKE_SOAP_PRESETS','cupcake_soap_square_v1','cupcakeSoapLabelSvg','data-cupcake-layout="square-v1"','cupcakePanelMarkup','createCupcakeSoapProject','applyCupcakePreset','packagingCupcakePurpose','packagingCupcakePresetKey','50.8'):
    req(token in pkg,'Packaging editor missing '+token)
req('newCupcakeSoapLabel' in pkgpage,'Packaging quick-start button missing')
req('cupcake_preset_key' in pkgserver and 'cupcake_purpose_text' in pkgserver,'Packaging server must persist Cupcake template defaults')
req('Applying a visual theme **does not overwrite' in pkgdoc,'Cupcake editable-data safety documentation missing')
for digest in ('974b29be1d35c8b34fe81098550d367d85ce162b90754c6c8b76bb9835ccf266','ea5d838f82d5717c77ccec7099a14bd4bda47337091fb01b806bcc1be7c398b5','d8ace63bf31f146c43e165411ebd83e09d70ea60cadabbe75eb66a50a37db2f4','37087b770f00c721da1fac339b03d3d3d243399bde0fa1f1cd352287af3dc748','c6df245f87c28b3320583056056b414ee451d55f28c3464ece7c1dc0d2642811'):
    req(digest in pkgdoc,'owner reference checksum missing: '+digest[:12])

req('Build 235 — Resume Work & Cross-Workspace Handoff' in road,'refinement roadmap successor missing')
req("run_current_contract('scripts/release467_build234_gate.py','Release 467 Build 234')" in sysgate,'System Gate must invoke Build 234')

print('RELEASE 467 BUILD 234 WORKFLOW HELP / EMPTY STATES / RECOVERY / CUPCAKE LABELS')
if FAIL:
    for i,x in enumerate(FAIL,1): print(f'{i:03d}. FAIL — {x}')
    sys.exit(1)
print('RELEASE 467 BUILD 234: PASS')
print('Canonical migration: 0023 reference-data templates')
print('Future queue exhausted: NO / Build 235 remains planned')
