# 04 — Project Ingestion Pipeline

## Build 201 live pipeline

```text
Approved/published product
  → Content Studio source-linked package
  → CAIP sync (automatic on create/approval/media review; manual from CAIP console)
  → Creative project upsert
  → Source reference upsert
  → Metadata-only deterministic analysis
  → Reuse candidate preparation
  → Source-fact evidence and story-spine refresh
  → Policy/readiness refresh
  → Run/event history + exportable manifest
```

## Step-by-step behaviour

1. Product approval triggers or refreshes the existing Content Studio package.
2. Build 201 calls CAIP sync as a best-effort additive companion. Content Studio success is not undone if CAIP has an error.
3. CAIP upserts the creative-project record from the Content Studio identity and snapshot.
4. Each Content Studio source-media row becomes a CAIP canonical asset reference.
5. Existing CAIP manual restrictions/notes/locks are preserved; blocked source safety is always honoured.
6. CAIP calculates deterministic scores from recorded order, featured/selected state, media type, dimensions/role/merchandising data when available, and source safety metadata.
7. CAIP recommends likely roles, but no recommendation is marked accepted automatically.
8. CAIP inserts/refreshes source-fact evidence from existing product/content fields.
9. CAIP refreshes an editable story spine. Locked editorial wording remains intact.
10. CAIP refreshes policy signals and stores a run/event record.

## Future pipeline stages

| Stage | Target capability | Required before enablement |
|---|---|---|
| Technical extraction | EXIF/media probe, duration, resolution, audio presence | Verified worker/provider, private source access, retry/cost guardrails |
| Semantic analysis | object/scene/transcript suggestions | Provider contract, evidence model, human-review policy, privacy review |
| Derivative generation | WebP/AVIF/proxies/contact sheets | immutable derivative recipe, rollback, storage budget, source preservation |
| Story enrichment | draft story variants from confirmed evidence | source citation rendering, locked-copy behavior, no unsupported claims |
| Render planning | timeline/shot list | approved asset list and output constraints |
| Render execution | MP4/thumbnail generation | signed inputs, job orchestration, output validation, cost/rate limits |
| Platform preparation | per-channel metadata packs | policy validator, owner approval, account permissions |
| Publishing | YouTube/Meta/TikTok/GBP actions | preview, OAuth, final owner confirmation, audit and rollback plan |

## Failure contract

An ingestion failure must leave existing source media, product records, Content Studio deliverables, and public releases untouched. CAIP records a failure/run event and offers a retry; it never substitutes a fallback image or makes an output look complete.
