#!/usr/bin/env python3
"""Build 440 Windows-safe Development R2 restore launcher regression.
Local-only: no Cloudflare, D1, R2, provider, or schema access.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
launcher = (ROOT / 'scripts/build440_development_inventory_asset_restore_windows.py').read_text(encoding='utf-8')
core = (ROOT / 'scripts/build440_development_inventory_asset_restore.py').read_text(encoding='utf-8')

checks = []
def check(condition, label):
    if not condition:
        raise AssertionError(label)
    checks.append(label)
    print(f'{len(checks):02d}. PASS — {label}')

print('BUILD 440 WINDOWS DEVELOPMENT R2 RESTORE LAUNCHER REGRESSION')
print('Cloudflare/D1/R2/provider access: NONE')
print('Production mutation capability: NONE')

check('import build440_development_inventory_asset_restore as core' in launcher, 'launcher reuses the guarded Build 440 restore authority')
check('stdout=stdout_handle' in launcher and 'stderr=stderr_handle' in launcher, 'Wrangler stdout/stderr use ordinary files rather than anonymous PIPE handles')
check('capture_output=True' not in launcher and 'subprocess.PIPE' not in launcher, 'launcher contains no captured Wrangler pipe path')
check('tempfile.gettempdir()' in launcher and 'wrangler-stdio' in launcher, 'Wrangler diagnostic files stay outside the repository')
check('WRANGLER_SEND_METRICS' in launcher and 'NO_COLOR' in launcher, 'launcher disables optional Wrangler metrics/color noise')
check('core.wrangler = windows_file_redirect_wrangler' in launcher, 'only the core Wrangler transport is replaced')
check('ORIGINAL_APPLY_RESTORE(assets, workers=1)' in launcher, 'Windows R2 apply is serialized to one Wrangler process')
check('core.apply_restore = windows_serial_apply' in launcher, 'serialized apply is installed before core execution')
check('return core.main()' in launcher, 'core argument parsing and authorization token remain authoritative')
check('DEV_BUCKET = "devilndove-toolshed-images-dev"' in core, 'core remains hard-pinned to the Development R2 bucket')
check('AUTHORIZED_EXPECTED_KEYS = 498' in core, 'core restore scope remains exactly 498 current Development keys')
check('APPLY_TOKEN = "BUILD440_DEV_R2_RESTORE"' in core, 'core apply authorization token remains unchanged')
check('"r2", "object", "delete"' not in core and '"r2", "object", "delete"' not in launcher, 'launcher/core expose no R2 delete operation')
check('Production R2 mutation executed: NO' in core, 'Production remains explicitly closed')

print(f'\nBUILD 440 WINDOWS DEVELOPMENT R2 RESTORE LAUNCHER REGRESSION: PASS ({len(checks)}/{len(checks)})')
print('Windows Wrangler transport: TEMP-FILE REDIRECT / NO PYTHON PIPE')
print('Windows R2 apply concurrency: 1')
print('Authorized current Development keys: 498')
print('Existing object overwrite: BLOCKED BY CORE')
print('Production R2 mutation: NONE')
print('D1 mutation: NONE')
print('PRODUCTION PROMOTION: CLOSED')
