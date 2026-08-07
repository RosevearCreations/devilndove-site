# 04 — CAIP Project Ingestion Pipeline

## Two valid ingestion paths

### A. Existing media references

```text
Product / Content Studio media
  → synchronize source identity/fingerprint
  → CAIP asset reference
  → rights/evidence/story review
```

CAIP does not copy/reorder/delete these existing source objects.

### B. Build 241 private raw media

```text
Creative Project
  → select/drop local image/video/audio batch
  → D1 creates upload session + file + part records
  → R2 multipart initiate
  → upload bounded parts + persist ETags
  → retry/resume incomplete parts
  → R2 complete + HEAD verification
  → internal-only media_assets + creative_assets record
  → technical observation
  → planned metadata/thumbnail/proxy/frame/audio/transcript jobs
  → evidence/story selection
```

## Intake facts captured before bytes move

- Creative Project;
- original filename and MIME type;
- file size;
- last modified/capture date when available;
- media role;
- upload device;
- privacy/consent/rights defaults;
- file fingerprint;
- generated object key;
- part size/count.

## Recovery

Completed part numbers and ETags are server-side/D1 state. A page refresh or network loss does not intentionally restart successful parts. After the browser fully closes, the owner may need to reselect the same local file because websites cannot silently regain local-file access.

## Duplicate warning

Build 241 warns when an uploaded file already exists with the same metadata fingerprint and byte size. It does not automatically discard the new evidence.

## Processing honesty

Processing jobs begin `planned` with provider `not_configured`. The presence of a job record means only that CAIP knows what should happen next. It does not mean a proxy, transcript, extracted frame, or derivative exists.

## Public handoff

A completed private asset can enter a reviewed public-promotion request if it is not blocked/revoked. The request itself never creates or publishes public media. Public delivery stays with Release Board/provider workflows.
