#!/usr/bin/env python3
"""Synchronize Build 439 CAIP temporal-evidence authority into database_full_schema.sql.

Local-only: this helper never contacts Cloudflare, D1, R2 or a provider. It appends the
exact focused Build 439 migration only when all three new table authorities are absent,
and refuses partial/ambiguous aggregate state.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
AGGREGATE = ROOT / 'database_full_schema.sql'
MIGRATION = ROOT / 'database_build439_caip_temporal_evidence_review.sql'
BEGIN_MARKER = '-- BEGIN BUILD 439 CAIP TEMPORAL EVIDENCE REVIEW AUTHORITY'
END_MARKER = '-- END BUILD 439 CAIP TEMPORAL EVIDENCE REVIEW AUTHORITY'
TABLES = (
    'creative_media_evidence_ranges',
    'creative_story_segment_evidence_links',
    'caip_media_processing_artifacts',
)
REQUIRED_SNIPPETS = (
    *(f'CREATE TABLE IF NOT EXISTS {table}' for table in TABLES),
    'idx_creative_media_evidence_project',
    'idx_creative_media_evidence_asset',
    'idx_creative_media_evidence_story',
    'idx_creative_segment_evidence_links_segment',
    'idx_creative_segment_evidence_links_range',
    'idx_caip_processing_artifacts_job',
    'idx_caip_processing_artifacts_project',
    'trg_caip_processing_complete_requires_verified_artifact',
    'trg_caip_processing_insert_complete_requires_verified_artifact',
    "'caip_frame_builder'",
    "'caip_audio_extractor'",
    'CAIP_PROCESSING_ARTIFACT_VERIFICATION_REQUIRED',
)


def fail(message: str) -> None:
    print(f'STOP: {message}', file=sys.stderr)
    raise SystemExit(1)


def read(path: Path) -> str:
    if not path.exists():
        fail(f'Missing required file: {path.name}')
    return path.read_text(encoding='utf-8')


def validate_aggregate(value: str) -> None:
    missing = [snippet for snippet in REQUIRED_SNIPPETS if snippet not in value]
    if missing:
        fail('Full schema is missing Build 439 authority: ' + ', '.join(missing))
    for table in TABLES:
        if value.count(f'CREATE TABLE IF NOT EXISTS {table}') != 1:
            fail(f'Full schema must contain exactly one {table} CREATE TABLE authority.')
    if value.count(BEGIN_MARKER) not in (0, 1):
        fail('Full schema contains duplicate Build 439 begin markers.')
    if BEGIN_MARKER in value and value.count(END_MARKER) != 1:
        fail('Full schema Build 439 marker block is incomplete.')


def sync() -> bool:
    aggregate = read(AGGREGATE)
    migration = read(MIGRATION).strip()
    presence = [f'CREATE TABLE IF NOT EXISTS {table}' in aggregate for table in TABLES]
    if any(presence) and not all(presence):
        fail('Full schema contains a partial Build 439 CAIP evidence authority. Refusing automatic append.')
    if all(presence):
        validate_aggregate(aggregate)
        print('BUILD 439 FULL-SCHEMA SYNC: ALREADY PRESENT / NO CHANGE')
        return False
    if BEGIN_MARKER in aggregate or END_MARKER in aggregate:
        fail('Build 439 marker exists without complete table authority. Refusing automatic append.')
    if not migration:
        fail('Focused Build 439 migration is empty.')

    suffix = (
        '\n\n'
        '/* =========================================================\n'
        '   BUILD 439 — CAIP TEMPORAL EVIDENCE REVIEW AUTHORITY\n'
        '   Focused authority: database_build439_caip_temporal_evidence_review.sql\n'
        '   ========================================================= */\n'
        f'{BEGIN_MARKER}\n'
        f'{migration}\n'
        f'{END_MARKER}\n'
    )
    updated = aggregate.rstrip() + suffix
    validate_aggregate(updated)
    AGGREGATE.write_text(updated, encoding='utf-8', newline='\n')
    print('BUILD 439 FULL-SCHEMA SYNC: UPDATED')
    print(f'Aggregate: {AGGREGATE.name}')
    print(f'Focused source: {MIGRATION.name}')
    print('Build 439 table authorities: 3 / EXACT')
    print('Build 439 indexes: 7 / PRESENT')
    print('Build 439 verified-completion triggers: 2 / PRESENT')
    print('Provider execution enabled by sync: NO')
    print('Cloudflare/D1/R2 access: NONE')
    return True


def check() -> None:
    validate_aggregate(read(AGGREGATE))
    print('BUILD 439 FULL-SCHEMA CHECK: PASS')
    for table in TABLES:
        print(f'{table}: PRESENT / SINGLE AUTHORITY')
    print('Build 439 indexes: 7 / PRESENT')
    print('Verified-artifact completion gate: PRESENT / FAIL CLOSED')
    print('Cloudflare/D1/R2 access: NONE')


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--sync', action='store_true')
    group.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.sync:
        sync()
        check()
    else:
        check()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
