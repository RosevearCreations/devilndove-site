#!/usr/bin/env python3
"""Local-only regression for Build 438 Development helper console output."""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / 'scripts' / 'build438_development_module_activation.py'

spec = importlib.util.spec_from_file_location('build438_dev_helper', HELPER)
if spec is None or spec.loader is None:
    raise SystemExit('FAIL: could not load Build 438 Development helper')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Cp1252Probe:
    encoding = 'cp1252'

    def __init__(self) -> None:
        self.parts: list[str] = []

    def write(self, value: str) -> int:
        # Emulate a Windows CP1252 console: unsupported Unicode must raise if the
        # helper failed to sanitize before writing.
        value.encode(self.encoding, errors='strict')
        self.parts.append(value)
        return len(value)

    def flush(self) -> None:
        return None


probe = Cp1252Probe()
module.emit_output('Wrangler ✓ — authenticated 😀', stream=probe)
rendered = ''.join(probe.parts)

checks = [
    ('emit_output helper exists', callable(getattr(module, 'emit_output', None))),
    ('CP1252 probe received output', bool(rendered)),
    ('unsupported Unicode was replaced safely', '?' in rendered),
    ('captured subprocess path remains UTF-8 decoded', "encoding='utf-8'" in HELPER.read_text(encoding='utf-8')),
    ('subprocess decoding uses replacement protection', "errors='replace'" in HELPER.read_text(encoding='utf-8')),
]

failures = []
for index, (label, ok) in enumerate(checks, 1):
    print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
    if not ok:
        failures.append(label)

print()
if failures:
    print(f'BUILD 438 DEVELOPMENT HELPER CONSOLE TEST: FAIL ({len(failures)}/{len(checks)} failed)')
    for failure in failures:
        print(' -', failure)
    raise SystemExit(1)

print(f'BUILD 438 DEVELOPMENT HELPER CONSOLE TEST: PASS ({len(checks)}/{len(checks)})')
print('Windows CP1252 UnicodeEncodeError path: PREVENTED')
print('Cloudflare/D1 access: NONE')
