#!/usr/bin/env python3
"""Build 439 local-only regression for recovered CAIP asset evidence linkage."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / 'functions/api/admin/caip-evidence-review.js'


def main() -> int:
    source = API.read_text(encoding='utf-8') if API.exists() else ''
    checks = [
        ('evidence API exists', bool(source)),
        ('marker writes resolve upload authority server-side', 'canonicalUploadFileId' in source and 'canonicalizeMarkerBody' in source),
        ('canonical upload requires same project and asset identity', 'WHERE creative_project_id=? AND creative_asset_id=?' in source),
        ('canonical upload requires uploaded state', "upload_status='uploaded'" in source),
        ('canonical upload prefers newest uploaded row', 'ORDER BY COALESCE(uploaded_at,updated_at,created_at) DESC,caip_media_upload_file_id DESC' in source),
        ('browser upload-file id is overwritten for save_marker', 'return { ...body, caip_media_upload_file_id: canonicalId }' in source),
        ('recovered asset duplicates are collapsed in response bundle', 'dedupeBundleAssets' in source and 'const best = new Map()' in source),
        ('uploaded linkage wins during asset dedupe', "upload_status || '').toLowerCase() === 'uploaded'" in source and '1000000000' in source),
        ('GET and POST bundles both use dedupe', source.count('dedupeBundleAssets(await loadCaipEvidenceReviewBundle') >= 3),
        ('400 responses expose stable safe error code and action', 'error_code: code' in source and 'action,' in source),
        ('source-media immutability and provider-disabled state remain explicit', 'source_media_unchanged: true' in source and 'provider_execution_active: false' in source),
    ]
    failures = []
    print('BUILD 439 RECOVERED EVIDENCE LINKAGE REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE\n')
    for index, (label, ok) in enumerate(checks, 1):
        print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
        if not ok:
            failures.append(label)
    if failures:
        print(f'\nBUILD 439 RECOVERED EVIDENCE LINKAGE REGRESSION: FAIL ({len(failures)}/{len(checks)} failed)')
        return 1
    print(f'\nBUILD 439 RECOVERED EVIDENCE LINKAGE REGRESSION: PASS ({len(checks)}/{len(checks)})')
    print('Recovered creative_asset_id: SINGLE UI AUTHORITY')
    print('Marker upload linkage: SERVER-CANONICALIZED')
    print('Production mutation capability: NONE')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
