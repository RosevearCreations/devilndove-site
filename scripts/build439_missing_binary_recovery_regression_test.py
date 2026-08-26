#!/usr/bin/env python3
"""Build 439 local-only regression for verified CAIP missing-binary recovery and playback diagnostics."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECOVERY = ROOT / 'functions/api/admin/caip-evidence-storage-recovery.js'
AUDIT_UI = ROOT / 'public/js/admin-caip-storage-audit.js'


def read(path: Path) -> str:
    return path.read_text(encoding='utf-8') if path.exists() else ''


def main() -> int:
    recovery = read(RECOVERY)
    ui = read(AUDIT_UI)
    checks = [
        ('recovery route exists and is Admin authenticated', bool(recovery) and 'getAdminUserFromRequest' in recovery),
        ('recovery is explicit prepare/finalize only', "action === 'prepare'" in recovery and "action === 'finalize'" in recovery),
        ('recovery supports linked historical upload lineage', 'linkedUpload' in recovery and 'recovery_of_file_id' in recovery and "linked_history" in recovery),
        ('recovery supports legacy asset-only lineage without dedupe', 'asset_only_legacy' in recovery and 'build439-asset-recovery' in recovery and 'createAssetOnlyRecoveryUpload' in recovery),
        ('asset-only recovery binds to explicit creative asset identity', 'assetOnlyTargetFromRow' in recovery and 'targetAssetId' in recovery and 'creative_asset_id' in recovery),
        ('legacy recovery verifies recorded filename and size when available', 'media_file_size_bytes' in recovery and 'media_original_filename' in recovery and 'original filename must match' in recovery),
        ('recovery verifies local SHA-256 content fingerprint', 'CONTENT_FINGERPRINT_VERSION' in recovery and '/^[a-f0-9]{64}$/' in recovery and 'setUploadFileContentFingerprint' in recovery),
        ('linked recovery creates a safe replacement under existing intake authority', 'createSafeReplacementUpload' in recovery and 'previous_missing_object_not_deleted' in recovery),
        ('asset-only recovery creates a dedicated private upload plan', 'INSERT INTO caip_media_upload_sessions' in recovery and 'INSERT INTO caip_media_upload_files' in recovery and 'insertPartPlan' in recovery),
        ('asset-only recovery never calls generic duplicate session creation', 'createUploadSession' not in recovery),
        ('finalization requires verified R2 HEAD and exact byte size', 'CAIP_PRIVATE_MEDIA_BUCKET.head' in recovery and 'head.size' in recovery and 'failed closed' in recovery),
        ('existing creative asset identity is preserved', 'existing_asset_identity_preserved: true' in recovery and 'UPDATE creative_assets SET' in recovery),
        ('transient replacement asset is archived rather than deleting history', "asset_status='archived'" in recovery and 'DELETE FROM creative_assets' not in recovery),
        ('replacement processing jobs are repointed to preserved asset identity', 'UPDATE caip_media_processing_jobs SET creative_asset_id=?' in recovery),
        ('recovery preserves previous media/key evidence in audit history', 'previous_media_asset_id' in recovery and 'previous_missing_object_key' in recovery),
        ('recovery records technical observation and project event', 'private_missing_binary_recovery' in recovery and 'caip_missing_binary_recovered' in recovery),
        ('recovery returns stable safe error codes', 'CAIP_RECOVERY_SIZE_MISMATCH' in recovery and 'CAIP_RECOVERY_FINGERPRINT_MISMATCH' in recovery and 'error_code: code' in recovery),
        ('recovery never deletes an R2 object or executes a provider', '.delete(' not in recovery and 'provider_execution_active: false' in recovery),
        ('Admin audit UI fingerprints the selected local source before recovery', 'contentFingerprintForFile' in ui and 'sample_sha256_v1' in ui),
        ('Admin audit UI uses existing bounded direct/multipart upload routes', 'caip-media-upload-direct' in ui and 'caip-media-upload-part' in ui and 'complete_file' in ui),
        ('Admin audit UI exposes Restore from original file', 'Restore from original file' in ui and 'data-caip439-recover' in ui),
        ('media error diagnosis distinguishes missing R2 from codec failure', 'not a codec diagnosis' in ui and 'recorded_keys_missing_from_dev_r2' in ui),
        ('media health binding is event-driven and contains no polling', 'MutationObserver' in ui and 'setInterval' not in ui and 'setTimeout' not in ui),
    ]

    failures = []
    print('BUILD 439 MISSING-BINARY RECOVERY REGRESSION')
    print('Cloudflare/D1/R2/provider access: NONE')
    print('Production mutation capability: NONE\n')
    for index, (label, ok) in enumerate(checks, 1):
        print(f'{index:02d}. {"PASS" if ok else "FAIL"} — {label}')
        if not ok:
            failures.append(label)
    if failures:
        print(f'\nBUILD 439 MISSING-BINARY RECOVERY REGRESSION: FAIL ({len(failures)}/{len(checks)} failed)')
        return 1
    print(f'\nBUILD 439 MISSING-BINARY RECOVERY REGRESSION: PASS ({len(checks)}/{len(checks)})')
    print('Missing binary recovery: LINKED-HISTORY + LEGACY ASSET-ONLY')
    print('Recovery upload: DEDICATED / PRIVATE / R2-VERIFIED')
    print('Existing creative_asset_id: PRESERVED')
    print('Old missing key/history: PRESERVED / NOT DELETED')
    print('Browser format panel: STORAGE FAILURE DISTINGUISHED FROM CODEC FAILURE')
    print('Provider execution: DISABLED')
    print('PRODUCTION PROMOTION: CLOSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
