# Build 707 — Independent Ninth-Reviewer Field Acceptance, Original Media Sign-Off Drift Monitoring & Financial Evidence Custody Audit

**Baseline:** Build 706 `main` commit `ba29283c43558ab2de456cc59c082e46bd5972d6`; production Cloudflare Pages deployment and live resource integrity proof passed before feature work.

## Original ninth reviewer in-field acceptance
- The independently controlled ninth Ed25519 key and its *original Build 706 signed continuity exception review* remain the sole cryptographic reviewer source. No new reviewer/key claim is fabricated.
- The authenticated original owner must choose the exact independently signed review **and** its source-bound SHA-256 financial retention manifest, inspect the external packet off-platform and record a 25–600 character owner statement.
- A durable, duplicate-guarded D1 receipt `owner_ninth_reviewer_field_acceptance_707` pins the original review, owner-retained evidence SHA, original 705 continuity receipt, ninth reviewer ID and current source revision/fingerprint. Readback is required.
- "Field acceptance" is an **owner-reported** review in the field. A real physical phone was **not** independently witnessed, and no additional independent signature was generated.

## Original camera sign-off drift
- The existing authenticated original Product camera draft is inspected using the current D1 attachment records and actual R2 HEAD responses, without mutating media.
- For *each* original Build 706 linked recovery owner sign-off, compare the signed D1 receipt's R2 key, byte size, attachment kind and ID, Build 705 recovery receipt, explicit Build 702 closure and fresh owner re-attestation against the current media.
- Return distinct fail-closed statuses for sign-off custody mismatch, missing/changed D1/R2 media, or stale/requiring-renewal owner re-attestation. A current stable readback proves only that specific on-demand observation, **not continuous monitoring**.
- Never auto-close unrecorded uploads, infer device attestation, change public media visibility or publish media.

## Original financial evidence custody audit
- With valid Build 707 field acknowledgement, the authenticated original owner can inspect the current signed chain and record a separate custody audit linked to the original Build 706 SHA-256 manifest, ninth review and field acceptance.
- D1 receipts are append-only and duplicate-guarded with exact source revision and fingerprint checks and readback. Deletion is not scheduled, but legal/permanent retention is **not** guaranteed.
- A protected `GET ?export=financial707&campaign_queue_id=<id>` exposes current evidence and HOLD status to an authenticated Admin with `private, no-store` headers. No bank API writes or automatic financial closure.
- Forged, replayed, duplicate, mismatched or stale source evidence fails closed, even if prior owner records exist.

## Release contract
- `scripts/build707_ninth_field_media_drift_custody_contract.mjs` includes positive and negative checks for media R2 drift, stale original evidence, source-pinned ninth review and custody digest mismatches, duplicate receipts and no false closure flags.
- Quality gate runs JavaScript syntax checks and the new regression alongside Build 706 and historical gates.
- Promote via feature → dev → main only after exact-SHA PR and dev checks, then confirm exact-`main` Cloudflare Pages deployment **and** independent live-resource integrity proof. Green CI is not physical-device acceptance, external bookkeeping close or an always-on runtime connection.
