#!/usr/bin/env python3
"""Build 422 local mapper for Build 421 rollout blockers.

Consumes the owner-generated Build 421 evidence log and produces a local Markdown
remediation note. It performs no network access and contains no database mutation
capability.

The parser deliberately does not depend on the Unicode dash rendered between the
PASS/BLOCKER state and label. Windows console/Git Bash encoding can replace that
separator while leaving the stable item number/state/label text intact.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_PATH = ROOT / 'build421_production_evidence.txt'
OUTPUT_PATH = ROOT / 'build422_blocker_mapping.local.md'

# Anchor only on stable ASCII fields. The remainder is normalized separately so
# an em dash, en dash, ASCII dash, replacement characters or console glyphs do
# not prevent an otherwise valid Build 421 evidence item from being parsed.
ITEM_RE = re.compile(r'^(\d{2})\.\s+(PASS|BLOCKER)\s+(.+)$')
LEADING_SEPARATOR_RE = re.compile(r'^[\s\-–—:?|>\ufffd▒?]+')


@dataclass(frozen=True)
class Item:
    number: int
    state: str
    label: str
    summary: str


def normalize_label(raw: str) -> str:
    value = raw.strip()
    cleaned = LEADING_SEPARATOR_RE.sub('', value).strip()
    return cleaned or value


def parse_items(text: str) -> list[Item]:
    lines = text.splitlines()
    items: list[Item] = []
    for index, line in enumerate(lines):
        match = ITEM_RE.match(line.strip())
        if not match:
            continue
        summary = ''
        if index + 1 < len(lines):
            next_line = lines[index + 1]
            if next_line.startswith('    '):
                summary = next_line.strip()
        items.append(
            Item(
                int(match.group(1)),
                match.group(2),
                normalize_label(match.group(3)),
                summary,
            )
        )
    return items


def family_for(label: str) -> tuple[str, str]:
    lower = label.lower()
    if 'accounting' in lower or 'general ledger' in lower:
        return 'accounting/default/nullability', 'Build data-preserving accounting fixtures; do not tighten constraints until the live values are explicitly mapped.'
    if 'product costs' in lower or 'movie catalog' in lower or 'product resource' in lower or 'tax class' in lower:
        return 'constraint/default review', 'Preserve existing rows and create a fixture for the exact type/default/nullability change before any Production rebuild.'
    if 'fractional' in lower or 'inventory' in lower:
        return 'fractional inventory', 'Preserve REAL/fractional values exactly; use table-copy fixtures with before/after row and value assertions.'
    if 'orphan' in lower or 'capture' in lower or 'visitor-session' in lower:
        return 'foreign-key/orphan', 'Resolve or explicitly preserve the orphan condition before adding the foreign key; the migration must fail closed while any orphan remains.'
    if 'product_number' in lower or 'uniqueness' in lower:
        return 'product identity uniqueness', 'Resolve duplicate/missing Product identity evidence before enforcing or rebuilding uniqueness.'
    if 'search_query_terms' in lower:
        return 'legacy table authority', 'Preserve all five Production rows while current runtime/schema authority is resolved; no copy or deletion is authorized.'
    if '__sql_test' in lower:
        return 'test-residue authority', 'Keep the empty Production table untouched until aggregate-schema/runtime authority and safe retirement are proven.'
    return 'unclassified blocker', 'Keep this migration family disabled until the exact evidence is reviewed and a specific remediation fixture is added.'


def render(items: list[Item]) -> str:
    blockers = [item for item in items if item.state == 'BLOCKER']
    lines = [
        '# Build 422 — Local Build 421 Blocker Mapping',
        '',
        'Generated from `build421_production_evidence.txt`.',
        '',
        '## Safety',
        '',
        '- Network access: **NONE**',
        '- D1/R2/provider mutation: **NONE**',
        '- Executable Production helper generated: **NO**',
        '- Production promotion: **CLOSED**',
        '',
        f'Parsed Build 421 evidence items: **{len(items)}**.',
        f'Parsed rollout blockers: **{len(blockers)}**.',
        '',
    ]
    if not blockers:
        lines += ['## Blockers', '', 'None parsed. This does not authorize Production mutation.', '']
    else:
        lines += ['## Blockers', '']
        for item in blockers:
            family, action = family_for(item.label)
            lines += [
                f'### Item {item.number:02d} — {item.label}',
                '',
                f'- Evidence: `{item.summary or "summary line not captured"}`',
                f'- Migration family: **{family}**',
                f'- Required disposition: {action}',
                '- Status: **FAIL-CLOSED / NOT AUTHORIZED FOR PRODUCTION WRITE**',
                '',
            ]
    lines += [
        '## Build 422 rule',
        '',
        'Other migration-family fixtures may continue locally, but this blocker family remains disabled until a reviewed remediation/preservation decision and regression fixture exist.',
        '',
    ]
    return '\n'.join(lines)


def main() -> int:
    if not EVIDENCE_PATH.exists():
        print(f'BUILD 422 BLOCKER MAPPER: FAIL — missing {EVIDENCE_PATH.name}')
        print('Run Build 421 first and keep build421_production_evidence.txt in the repository working directory.')
        return 1
    items = parse_items(EVIDENCE_PATH.read_text(encoding='utf-8', errors='replace'))
    blockers = [item for item in items if item.state == 'BLOCKER']
    if len(items) != 20:
        print(f'BUILD 422 BLOCKER MAPPER: FAIL — expected 20 Build 421 evidence items, parsed {len(items)}')
        if not items:
            print('The evidence file exists, but no numbered PASS/BLOCKER records were recognized.')
            print('Inspect the first numbered lines with: grep -nE "^[0-9][0-9]\\." build421_production_evidence.txt | head')
        return 1
    OUTPUT_PATH.write_text(render(items), encoding='utf-8')
    print('BUILD 422 BLOCKER MAPPER: PASS')
    print(f'Build 421 evidence items parsed: {len(items)}')
    print(f'Rollout blockers parsed: {len(blockers)}')
    for item in blockers:
        family, _ = family_for(item.label)
        print(f' - {item.number:02d}: {item.label} [{family}]')
        if item.summary:
            print(f'   {item.summary}')
    print(f'Local mapping: {OUTPUT_PATH.name}')
    print('No Cloudflare resource was contacted.')
    print('No database or R2 mutation was executed.')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
