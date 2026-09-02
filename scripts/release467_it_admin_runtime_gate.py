#!/usr/bin/env python3
"""Release 467 I.T./Admin runtime reliability source gate.

Proves the first reliability batch without contacting Cloudflare or mutating D1/R2.
Historical release files remain provenance; this gate protects the active canonical
Development helper/workflow/runtime surfaces from retired project targets.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / 'functions/api/admin/app-modules.js'
UI = ROOT / 'public/js/admin-application-modules.js'
HTML = ROOT / 'admin/application-modules/index.html'
HARNESS = ROOT / 'scripts/development_runtime_acceptance.py'
ACCESS_HELPER = ROOT / 'scripts/cloudflare_development_access.py'
WORKFLOW = ROOT / '.github/workflows/development-runtime-acceptance.yml'
REPAIR = ROOT / 'scripts/release467_root_admin_access.py'
GUIDE = ROOT / 'docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md'

checks: list[tuple[str, bool]] = []


def check(label: str, condition: bool) -> None:
    ok = bool(condition)
    checks.append((label, ok))
    print(('PASS' if ok else 'FAIL') + ' — ' + label)


for path in (API, UI, HTML, HARNESS, ACCESS_HELPER, WORKFLOW, REPAIR, GUIDE):
    check(f'{path.relative_to(ROOT)} exists', path.is_file())

api = API.read_text(encoding='utf-8')
ui = UI.read_text(encoding='utf-8')
html = HTML.read_text(encoding='utf-8')
harness = HARNESS.read_text(encoding='utf-8')
helper = ACCESS_HELPER.read_text(encoding='utf-8')
workflow = WORKFLOW.read_text(encoding='utf-8')
repair = REPAIR.read_text(encoding='utf-8')
guide = GUIDE.read_text(encoding='utf-8')

subprocess.run([sys.executable, '-m', 'py_compile', str(HARNESS), str(ACCESS_HELPER), str(REPAIR)], cwd=ROOT, check=True)
subprocess.run([sys.executable, str(HARNESS), '--self-check'], cwd=ROOT, check=True)
subprocess.run(['node', '--check', str(API)], cwd=ROOT, check=True)
subprocess.run(['node', '--check', str(UI)], cwd=ROOT, check=True)

# Module/profile authority.
for token in (
    'FROM users', 'FROM app_module_user_access', 'profiles:', 'root_admin_full_manage',
    "action === 'set_user_access'", "action === 'clear_user_access'", 'it_manager_required',
    'root_admin_it_recovery_guard', "module_key='it-platform'",
):
    check(f'module API contains {token}', token in api)
check('module API has no request-time DDL', not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER)\b', api, re.I))
check('I.T. role-derived grant remains forbidden', 'it_explicit_user_access_required' in api)

for token in ('applicationModuleProfilesMount', 'applicationModuleProfilesStatus', 'data-user-access', 'root_admin_full_manage'):
    check(f'module UI contains {token}', token in ui)
check('module UI removed hardcoded Release 447 gate', 'const RELEASE = 447' not in ui and 'release mismatch' not in ui)
check('module page exposes account profile section', 'Account profiles &amp; explicit module access' in html and 'applicationModuleProfilesMount' in html)
check('module page has exactly one H1', len(re.findall(r'<h1\b', html, re.I)) == 1)
check('module page no longer presents Release 447 as current', 'Release 447' not in html)

# Canonical Cloudflare Development authority.
for token in (
    "EXPECTED_PAGES_PROJECT = 'devilndove-site'", 'name = "{EXPECTED_PAGES_PROJECT}"',
    "'DND_ENVIRONMENT = \"development\"'", "'DND_PAGES_PROJECT = \"{EXPECTED_PAGES_PROJECT}\"'",
    "EXPECTED_DATABASE_NAME = 'devilndove-dev'", "EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'",
):
    check(f'Cloudflare helper contains {token}', token in helper)
check('Cloudflare helper has no retired Pages project target', 'name = "devilndove-site-dev"' not in helper and '`devilndove-site-dev`' not in helper)
check('I.T. startup guide uses canonical Pages project', '`devilndove-site`' in guide and 'Pages: `devilndove-site-dev`' not in guide)

# Runtime harness and workflow: canonical Preview, GET-only, secret-safe.
for token in (
    "DEFAULT_BASE_URL = 'https://dev.devilndove-site.pages.dev'", "ACCESS_ID_ENV = 'CF_ACCESS_CLIENT_ID'",
    "ACCESS_SECRET_ENV = 'CF_ACCESS_CLIENT_SECRET'", "'it_control_tower': '/api/admin/it-control-tower'",
    'root_admin_full_manage', "method='GET'", "'production_mutation': 'FORBIDDEN'",
):
    check(f'runtime harness contains {token}', token in harness)
check('runtime harness rejects retired Pages project', "'https://devilndove-site-dev.pages.dev'" in harness and "host == 'devilndove-site-dev.pages.dev'" not in harness)
check('runtime harness has no write HTTP methods', all(token not in harness for token in ("method='POST'", "method='PUT'", "method='PATCH'", "method='DELETE'")))

for token in (
    'name: Development Runtime Acceptance', 'https://dev.devilndove-site.pages.dev',
    'CF_ACCESS_CLIENT_ID: ${{ secrets.CF_ACCESS_CLIENT_ID }}', 'CF_ACCESS_CLIENT_SECRET: ${{ secrets.CF_ACCESS_CLIENT_SECRET }}',
    'data/development-runtime-acceptance-request.json', 'SELECT COALESCE(NULLIF(s.session_token',
    'ROOT ADMIN MODULE AUTHORITY: PASS', '--anonymous-check', '--evidence-json',
    'D1 mutation: NONE', 'R2 mutation: NONE', 'Provider execution/publication: CLOSED',
):
    check(f'runtime workflow contains {token}', token in workflow)
check('runtime workflow has no retired Pages project target', 'devilndove-site-dev.pages.dev' not in workflow)
check('runtime workflow cannot apply D1 files', '--file' not in workflow)
for pattern in (r'\bINSERT\s+INTO\b', r'\bUPDATE\s+\w+\s+SET\b', r'\bDELETE\s+FROM\b', r'\bALTER\s+TABLE\b', r'\bDROP\s+(?:TABLE|INDEX)\b', r'\bCREATE\s+(?:TABLE|INDEX|TRIGGER)\b'):
    check(f'runtime workflow excludes mutation SQL {pattern}', re.search(pattern, workflow, re.I) is None)

# Development-only root-admin repair is deliberately narrow and schema-neutral.
for token in (
    "EXPECTED_DATABASE_NAME = 'devilndove-dev'", "EXPECTED_DATABASE_ID = 'dbc1615b-dcbe-4951-973b-b47c99c73bfa'",
    "module_key='it-platform'", 'app_module_user_access', 'access_level', 'manage',
    'Production mutation capability: NONE', '--verify-only',
):
    check(f'root-admin repair contains {token}', token in repair)
check('root-admin repair has no schema DDL', not re.search(r'\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|TRIGGER)\b', repair, re.I))
check('root-admin repair cannot target Production D1', 'devilndove-prod' not in repair and 'f34a741b-0000-45b0-9a96-6be08754d563' not in repair)

# Active operational target regression. Historical provenance files are intentionally not scanned.
active_target_files = {
    'cloudflare helper': helper,
    'runtime workflow': workflow,
    'I.T. startup guide': guide,
}
for label, text in active_target_files.items():
    check(f'{label} does not target retired Development Pages project', 'devilndove-site-dev' not in text)

passed = sum(1 for _, ok in checks if ok)
print(f'\nRELEASE 467 I.T./ADMIN RUNTIME RELIABILITY SOURCE GATE: {passed}/{len(checks)} passed')
print('Cloudflare contact: NONE')
print('D1/R2 mutation: NONE')
print('Provider execution/publication: NONE')
print('Production mutation: NONE')
raise SystemExit(0 if passed == len(checks) else 1)
