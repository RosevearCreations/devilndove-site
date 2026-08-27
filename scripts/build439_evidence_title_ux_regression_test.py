#!/usr/bin/env python3
"""Build 439 local-only regression for CAIP evidence-title UX guard."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UI = ROOT / 'public/js/admin-caip-evidence-title-assist.js'
PAGE = ROOT / 'admin/creative-assets/index.html'


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8') if path.exists() else ''


def main() -> int:
    ui = read(UI)
    page = read(PAGE)
    release = json.loads(read(ROOT / 'development-release.json') or '{}')
    asset_version = str(release.get('release') or 439)
    evidence_asset = f'admin-caip-evidence-review.js?v={asset_version}'
    title_asset = f'admin-caip-evidence-title-assist.js?v={asset_version}'
    provider_execution_tokens = (
        'provider_url',
        'provider_endpoint',
        'executeProvider',
        'execute_provider',
        '/api/provider',
        '/api/admin/provider',
        'provider_key:',
    )
    checks = [
        ('title assist script exists', bool(ui)),
        ('creative-assets page loads title assist after evidence review', evidence_asset in page and title_asset in page and page.index(evidence_asset) < page.index(title_asset)),
        ('auto title is neutral source/category/time metadata', 'selectedFilename()' in ui and 'categoryLabel()' in ui and 'capturedTimeLabel()' in ui),
        ('capture actions auto-draft the title', all(token in ui for token in ('caip439CaptureStart', 'caip439CaptureEnd', 'caip439ClearEnd')) and 'queueMicrotask' in ui),
        ('save action ensures a nonblank title before evidence POST', "target.id === 'caip439SaveNewMarker'" in ui and 'ensureTitle();' in ui),
        ('human-entered title overrides auto-draft', "delete target.dataset.caip439AutoDrafted" in ui),
        ('title assist makes no network calls', all(token not in ui for token in ('fetch(', 'apiFetch', 'XMLHttpRequest'))),
        ('title assist contains no polling or provider execution', 'setInterval' not in ui and 'setTimeout' not in ui and all(token not in ui for token in provider_execution_tokens)),
    ]

    failures = []
    print('BUILD 439 EVIDENCE TITLE UX REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE\n')
    for index, (label, ok) in enumerate(checks, 1):
        print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
        if not ok:
            failures.append(label)
    if failures:
        print(f'\nBUILD 439 EVIDENCE TITLE UX REGRESSION: FAIL ({len(failures)}/{len(checks)} failed)')
        return 1
    print(f'\nBUILD 439 EVIDENCE TITLE UX REGRESSION: PASS ({len(checks)}/{len(checks)})')
    print('Blank-title evidence POST: PREVENTED BY UI DEFAULT')
    print('Human title override: PRESERVED')
    print('Network/provider side effects: NONE')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
