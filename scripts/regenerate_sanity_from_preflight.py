#!/usr/bin/env python3
"""Regenerate the top SANITY_HEALTH_CHECK.md section from data/site/deployment-preflight.json."""
from __future__ import annotations
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SANITY = ROOT/'SANITY_HEALTH_CHECK.md'
PREFLIGHT = ROOT/'data/site/deployment-preflight.json'
START = '<!-- BUILD_175_PREFLIGHT_SANITY_START -->'
END = '<!-- BUILD_175_PREFLIGHT_SANITY_END -->'

def main() -> int:
    data=json.loads(PREFLIGHT.read_text(encoding='utf-8'))
    lines=[
        START,
        '# Build 175 Deployment Preflight Sanity Notes',
        '',
        f"Static package preflight result for this zip: **{data.get('status','unknown')}**.",
        '',
        f"- Blockers: {data.get('blocker_count', 0)}.",
        f"- Warnings: {data.get('warning_count', 0)}.",
        f"- Checks: {len(data.get('checks', []))}.",
        '- One-H1/title/meta/local wording, CSS brace balance, JSON parse, schema file presence, release-manifest, and Build 175 release-control checks were regenerated from the static preflight data.',
        '',
        'Post-deploy order:',
        '1. Run `database_build171_ledger_repair.sql` only if Build 171 schema already exists but the marker is missing.',
        '2. Run `database_build173_deployment_preflight.sql`.',
        '3. Run `database_build174_deployment_preflight_detail.sql`.',
        '4. Run `database_build175_release_control.sql`.',
        '5. Open `/admin/deployment-preflight/`, run Preflight, export Markdown if warnings remain, save snapshot, and confirm post-deploy checklist rows.',
        '6. Open `/admin/release-control/` to seed mobile views, queue screenshot jobs, and review LocalBusiness schema.',
        END,
        ''
    ]
    section='\n'.join(lines)
    current=SANITY.read_text(encoding='utf-8') if SANITY.exists() else ''
    if START in current and END in current:
        before=current.split(START,1)[0]
        after=current.split(END,1)[1].lstrip('\n')
        current=before+section+after
    else:
        current=section+'\n'+current
    SANITY.write_text(current, encoding='utf-8')
    print('SANITY_HEALTH_CHECK.md regenerated from deployment-preflight.json')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
