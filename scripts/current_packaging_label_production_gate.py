#!/usr/bin/env python3
"""Release-neutral forward gate for Packaging Label Production & Reuse."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SERVICE = ROOT / 'functions/api/admin/packaging-label-production.js'
BROWSER = ROOT / 'public/js/admin-packaging-label-production-v44.js'
COMPAT = ROOT / 'public/js/admin-packaging-compatibility-v301.js'
DOMAIN = ROOT / 'functions/api/_lib/packagingDomainService.js'
PRINT = ROOT / 'public/js/admin-packaging-print-source-v299.js'


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f'PACKAGING LABEL PRODUCTION GATE: FAIL — {message}')

for path in (SERVICE, BROWSER, COMPAT, DOMAIN, PRINT):
    require(path.exists(), f'missing {path.relative_to(ROOT)}')

service = SERVICE.read_text(encoding='utf-8')
browser = BROWSER.read_text(encoding='utf-8')
compat = COMPAT.read_text(encoding='utf-8')
domain = DOMAIN.read_text(encoding='utf-8')
print_source = PRINT.read_text(encoding='utf-8')
compact = re.sub(r'\s+', '', service)

require('constBUILD=44;' in compact, 'service must retain Build 44 identity')
for authority in ('packaging_printer_profiles', 'packaging_project_versions', 'soap_label_print_tests', 'packaging_export_history'):
    require(authority in service, f'existing production authority missing: {authority}')
require('scale===100' in compact, 'printer profiles must prove exact 100% scale')
require("String(row.review_status||'')==='approved'" in compact, 'approved saved version requirement missing')
require('immutable_svg_artifact' in service and 'reusable_production_version' in service, 'immutable reusable version proof missing')
require("wrap_fit_status:'passed'" in compact and "legibility_status:'passed'" in compact and "overlap_status:'passed'" in compact, 'physical QA pass rules missing')
require('build41_safe_area_required_at_print_time:true' in compact, 'Build 41 safe-area dependency missing')
require('build43_composition_required_at_print_time:true' in compact, 'Build 43 composition dependency missing')
require('authoritative_readback:true' in compact, 'read-only authoritative D1 read-back flag missing')
require('d1_mutation:false' in compact and 'r2_mutation:false' in compact and 'production_contacted:false' in compact, 'service safety boundary missing')

for pattern in (r'\bCREATE\s+(?:TABLE|INDEX|VIEW|TRIGGER)\b', r'\bALTER\s+TABLE\b', r'\bDROP\s+(?:TABLE|INDEX|VIEW|TRIGGER)\b'):
    require(not re.search(pattern, service, flags=re.I), f'request-time DDL detected: {pattern}')

require('const BUILD = 44' in browser, 'browser Build 44 identity missing')
require("const ENDPOINT = '/api/admin/packaging-label-production'" in browser, 'browser production endpoint changed')
require('Production Library' in browser and 'Print approved version at true size' in browser, 'production/reuse workspace missing')
require("byId('printTestScale').value = '100'" in browser, 'production print must force exact 100% scale')
require('DDPackagingSafeArea' in browser, 'Build 41 safe-area runtime proof missing from production print')
require('packaging-label-composition' in browser, 'Build 43 composition read-back missing from production print')
require('reusable_versions' in browser and 'qa_history' in browser, 'versioned reuse/QA history UI missing')
require('productionContacted: false' in browser and 'requestTimeDdl: false' in browser, 'browser safety snapshot missing')

require("status==='passed'&&(number(body.scale_percent)!==100" in domain, 'existing physical QA must still require 100% scale')
require("wrap!=='passed'||legibility!=='passed'||overlap!=='passed'" in domain, 'existing physical QA pass conditions changed')
require('savedVersionsImmutable: true' in print_source, 'saved-version immutable print-source protection missing')
require('/public/js/admin-packaging-label-production-v44.js?v=46744' in compat, 'compatibility layer must load Build 44 production layer')
require('labelProductionBuild' in compat and 'labelProductionReady' in compat, 'compatibility snapshot must project Build 44 state')
require("'dd:packaging-label-production-active'" in compat, 'compatibility checkpoint must observe Build 44 activation')

canonical = ROOT / 'migrations' / 'canonical'
if canonical.exists():
    require(not list(canonical.glob('0005*')), 'Build 44 must not introduce canonical migration 0005')

print('CURRENT PACKAGING LABEL PRODUCTION GATE: PASS')
