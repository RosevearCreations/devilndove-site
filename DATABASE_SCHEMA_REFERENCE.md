> Build 242 note: no new D1 objects are required for the inventory-create repair. The current migration boundary remains Build 241; all aggregate schema files were re-synchronized and marked for Build 242.

# Database Schema Reference — Build 241

## Current migration boundary

Build 241 is the current additive production migration:

- numbered: `database_build241_caip_large_media_intake.sql`
- current pass: `database_upgrade_current_pass.sql`

These files are byte-identical. Build 241 assumes prior ledger key `build240_operational_evidence_continuity`. Back up D1, apply one Build 241 file once, never both.

Fresh/scoped aggregate schema files are synchronized with the same Build 241 block:

- `database_schema.sql`
- `database_full_schema.sql`
- `database_store_schema.sql`

Sync utility: `node scripts/sync-build241-aggregate-schema.mjs`.

## Build 241 CAIP tables

### `caip_media_intake_settings`
Non-secret implementation policy such as bucket binding aliases, default part size/parallelism, current/future transport labels and immutable raw policy.

### `caip_media_upload_sessions`
One resumable upload batch for one Creative Project. Stores status, generated object prefix, transport, part policy, device/source note and aggregate progress.

### `caip_media_upload_files`
One source file inside a session. Stores original filename metadata, generated file/object keys, media role/type, size/capture/device, multipart state, fingerprint/checksum state, privacy/consent/rights and linked CAIP asset after completion.

### `caip_media_upload_parts`
One bounded multipart part with byte range, expected size, status, ETag, attempt/error and timestamps. This is the interruption/resume authority.

### `caip_media_processing_jobs`
Planned/queued/running/completed/failed processing work such as metadata, proxy video, thumbnail, frame extraction, audio extraction and transcript. `provider_key='not_configured'` must never be presented as a completed provider output.

### `caip_media_public_promotion_requests`
Review-only request to move an approved candidate toward public storage/provider use. Stores private source key and rights/consent/privacy snapshots. Build 241 creates no public copy.

## Shared dependency

Build 241 idempotently ensures `media_assets` exists because older scoped aggregate paths could contain CAIP foreign-key references without carrying the shared media table definition. Existing production databases keep their existing table; `CREATE TABLE IF NOT EXISTS` does not replace it.

Completed Build 241 raw uploads register a private `media_assets` row:

```text
storage_provider = r2_private_caip
bucket_name      = CAIP_PRIVATE_MEDIA_BUCKET
public_url       = NULL
```

and a linked `creative_assets` row containing private raw provenance.

## Build 241 seeds

- provider profiles: private multipart enabled-when-bound, future direct S3 multipart planned, proxy/transcript providers disabled until configured;
- operational workstream: `caip_large_media_intake`;
- Startup metadata refresh: all 46 current gate definitions are upserted without overwriting mutable owner/status/evidence fields, including `caip_private_large_media_intake` as the 46th active gate;
- migration ledger: `build241_caip_large_media_intake`.

## Retained Build 240 operational tables

Build 240 remains the prerequisite authority for runtime incidents, operational workstreams, production evidence, idempotency, packaging reservation/formula/lock/prepress, provider/notification results, mobile evidence, asset/media checks, support/accounting/approval/SEO/page-audit/fallback/mobile-card continuity.

Build 241 adds one workstream, bringing the current active count to 21.

## Runtime schema rule

CAIP, Packaging, Creative Automation, Creative Process, Startup Readiness and Operational Continuity must not install schema at request time. Runtime routes verify required tables and return an explicit migration error/fallback when absent. Schema creation/seeding belongs to migrations and repeatable deployment tests.

## D1 transaction rule

The current migration contains no explicit `BEGIN`, `COMMIT`, `SAVEPOINT`, `RELEASE` or `ROLLBACK`. Composite transactional behavior that requires atomicity should use the platform-supported application/database mechanisms designed for the actual runtime rather than embedding unsupported transaction control into a migration script.

## Historical migrations

Numbered SQL migrations remain at repository root because repair/deployment tooling addresses them by exact filename. Historical Build prose/validation belongs under `docs/archive/build-history/`. Use `AI_HANDOFF.md` for current deployment order rather than inferring order from old release prose.
