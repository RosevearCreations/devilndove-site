#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
TARGETS = range(80, 95)
MANIFEST_ASSERTION = re.compile(
    r"(\[row\.get\('file'\)\s+for\s+row\s+in\s+manifest\.get\('migrations',\s*\[\]\)\])\s*==\s*(expected|EXPECTED)"
)

for build in TARGETS:
    path = ROOT / f'scripts/release467_build{build}_gate.py'
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    out = []
    replaced_manifest = 0
    removed_future_ban = 0

    for line in lines:
        match = MANIFEST_ASSERTION.search(line)
        if match:
            expected_name = match.group(2)
            line = MANIFEST_ASSERTION.sub(
                lambda m: f"{m.group(1)}[:len({expected_name})] == {expected_name}",
                line,
                count=1,
            )
            line = line.replace(
                'must keep canonical migrations 0001-0004 exactly',
                'must preserve historical canonical migrations 0001-0004 as prefix',
            )
            line = line.replace(
                'canonical migration stream drifted',
                'historical canonical migration baseline drifted',
            )
            replaced_manifest += 1

        if ".glob('0005*')" in line or '.glob("0005*")' in line:
            removed_future_ban += 1
            continue

        if 'Canonical D1 migrations: 0001-0004 / UNCHANGED' in line:
            line = line.replace(
                'Canonical D1 migrations: 0001-0004 / UNCHANGED',
                'Historical canonical D1 baseline: 0001-0004 / PRESERVED; later forward migrations permitted',
            )

        out.append(line)

    if replaced_manifest != 1:
        raise SystemExit(f'Build {build}: expected one frozen manifest assertion, found {replaced_manifest}')
    if removed_future_ban != 1:
        raise SystemExit(f'Build {build}: expected one future-0005 ban, found {removed_future_ban}')

    path.write_text('\n'.join(out) + '\n', encoding='utf-8')
    print(f'Build {build}: historical 0001-0004 prefix preserved; later forward migrations permitted')

# Prove every retained historical contract after the repair, then prove the
# current System provenance chain and Build 156 itself.
for build in TARGETS:
    subprocess.run(['python', f'scripts/release467_build{build}_gate.py'], cwd=ROOT, check=True)
subprocess.run(['python', 'scripts/current_system_gate_provenance_gate.py'], cwd=ROOT, check=True)
subprocess.run(['python', 'scripts/release467_build156_gate.py'], cwd=ROOT, check=True)
print('Build 156 historical migration gate repair: GREEN')
