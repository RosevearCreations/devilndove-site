#!/usr/bin/env python3
"""Release-neutral forward gate for Packaging Material Template Intelligence."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SERVICE = ROOT / 'functions/api/admin/packaging-material-intelligence.js'
BROWSER = ROOT / 'public/js/admin-packaging-material-intelligence-v42.js'
COMPAT = ROOT / 'public/js/admin-packaging-compatibility-v301.js'


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f'PACKAGING MATERIAL INTELLIGENCE GATE: FAIL — {message}')


for path in (SERVICE, BROWSER, COMPAT):
    require(path.exists(), f'missing {path.relative_to(ROOT)}')

service = SERVICE.read_text(encoding='utf-8')
browser = BROWSER.read_text(encoding='utf-8')
compat = COMPAT.read_text(encoding='utf-8')
compact_service = re.sub(r'\s+', '', service)

require('constBUILD=42;' in compact_service, 'service must retain Build 42 identity')
require("newSet(['required','print_default','optional','internal_only'])" in compact_service, 'four inheritance policies changed or disappeared')
require("newSet(['needs_review','supplier_declared','supplier_verified','owner_verified','internal_note'])" in compact_service, 'provenance states changed or disappeared')
require("action==='save_template_intelligence'" in compact_service, 'template intelligence save action missing')
require("action==='normalize_project_inheritance'" in compact_service, 'project inheritance normalization action missing')
require('duplicates_removed' in service and 'policies_applied' in service, 'normalization evidence must remain explicit')
require('canonical(' in service and 'keeperByKey' in service, 'canonical INCI deduplication authority missing')
require('POLICY_PRIORITY' in service and 'choosePolicy' in service, 'deterministic policy precedence missing')
require('required_on_label' in service, 'policy-to-print inheritance bridge missing')

# Build 42 must remain data-layer additive: normal Packaging business writes are allowed,
# but schema creation/repair is never allowed at request time.
ddl_patterns = (
    r'\bCREATE\s+(?:TABLE|INDEX|VIEW|TRIGGER)\b',
    r'\bALTER\s+TABLE\b',
    r'\bDROP\s+(?:TABLE|INDEX|VIEW|TRIGGER)\b',
    r'\bPRAGMA\s+foreign_keys\b',
)
for pattern in ddl_patterns:
    require(not re.search(pattern, service, flags=re.I), f'request-time DDL detected: {pattern}')

require("const BUILD = 42" in browser, 'browser Material Intelligence identity missing')
require("const ENDPOINT = '/api/admin/packaging-material-intelligence'" in browser, 'browser endpoint authority changed')
require('materialIntelligenceBuild: BUILD' in browser, 'native Packaging client must expose additive intelligence provenance')
require("body?.action !== 'apply_source_material_template'" in browser, 'source-template attach normalization wrapper missing')
require('normalizeProject(pid)' in browser, 'automatic post-attach normalization missing')
require('originalRequest(null, pid)' in browser, 'post-normalization authoritative read-back missing')
require('data-build42-save-intelligence' in browser, 'Material Library reusable-intelligence save control missing')
require('data-build42-normalize-project' in browser, 'explicit project normalization control missing')
require('Build 43 will own per-label overrides' in browser, 'Build 42/43 responsibility boundary missing')
require('schemaChange: false' in browser and 'requestTimeDdl: false' in browser, 'browser safety status must remain explicit')
require('productionContacted: false' in browser, 'browser safety status must preserve Production isolation')

require('/public/js/admin-packaging-material-intelligence-v42.js?v=46742' in compat, 'Packaging compatibility checkpoint must load Build 42 browser layer')
require("document.addEventListener('dd:packaging-material-intelligence-active', publishState)" in compat, 'compatibility status must observe Build 42 activation')
require('materialIntelligenceBuild' in compat and 'materialIntelligenceActive' in compat, 'compatibility snapshot must project Build 42 state')

# This Release 467 Build 42 must not add a new migration. Historical build-numbered files,
# if any, are evaluated relative to the branch diff by GitHub diff safety and canonical migration gates.
require(not list((ROOT / 'migrations').glob('*467*42*')) if (ROOT / 'migrations').exists() else True, 'Build 42 must not introduce a Release 467 canonical schema migration')

print('CURRENT PACKAGING MATERIAL INTELLIGENCE GATE: PASS')
