#!/usr/bin/env python3
"""Build 439 local-only regression for the read-only CAIP R2 linkage diagnostic."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTE = ROOT / 'functions/api/admin/caip-evidence-storage-diagnostic.js'


def main() -> int:
    source = ROUTE.read_text(encoding='utf-8') if ROUTE.exists() else ''
    checks = [
        ('diagnostic route exists', bool(source)),
        ('diagnostic is admin authenticated', 'getAdminUserFromRequest' in source),
        ('diagnostic uses R2 HEAD only', 'bucket.head' in source and 'bucket.get' not in source),
        ('diagnostic never mutates R2', all(token not in source for token in ('bucket.put', 'bucket.delete', 'createMultipartUpload', 'resumeMultipartUpload'))),
        ('diagnostic never executes D1 mutation SQL', all(token not in source.upper() for token in ('INSERT INTO', 'UPDATE ', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE'))),
        ('diagnostic checks media/upload/metadata/observation candidates', all(token in source for token in ('media_assets', 'caip_media_upload_files', 'creative_asset_source_metadata', 'creative_asset_technical_observations'))),
        ('diagnostic classifies recoverable drift vs missing Dev R2 object', 'recoverable_metadata_drift' in source and 'recorded_keys_missing_from_dev_r2' in source),
        ('diagnostic explicitly reports no source/provider mutation', 'source_media_unchanged: true' in source and 'r2_mutation_executed: false' in source and 'provider_execution_active: false' in source),
        ('diagnostic failure path stays read-only', 'captureRuntimeIncident' not in source and 'auditAdminAction' not in source),
    ]
    failures = []
    print('BUILD 439 STORAGE DIAGNOSTIC REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE\n')
    for index, (label, ok) in enumerate(checks, 1):
        print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
        if not ok:
            failures.append(label)
    if failures:
        print(f'\nBUILD 439 STORAGE DIAGNOSTIC REGRESSION: FAIL ({len(failures)}/{len(checks)} failed)')
        return 1
    print(f'\nBUILD 439 STORAGE DIAGNOSTIC REGRESSION: PASS ({len(checks)}/{len(checks)})')
    print('Runtime diagnostic contract: D1 READS + R2 HEAD ONLY')
    print('Source media mutation: NONE')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
