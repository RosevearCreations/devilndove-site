# Release 467 · Build 573 — Owner Evidence Intake Review, Device Exception Disposition & Acceptance Decision Safeguards

## Scope and evidence truth

No new authentic owner-device receipts, independent defect verifications, or owner acceptance decisions were supplied for this build. Production GREEN proves the deployed code and boundaries, **not** that an Admin screen was accepted by a person on the reported device.

## Browser-local intake and open-case dispositions

Section 7 of `/admin/device-acceptance/` accepts a **complete Build 572 JSON evidence packet** copied from another device, or prepares one from this browser's saved Build 569–572 records. Copied input is capped at 180,000 characters, requires an explicit review/unauthenticated-intake checkbox, and passes `validateAcceptancePacket572` before staging.

The validation recomputes classifications from the included original Build 569 report, exact Build 571 retest, and optional Build 572 source-review note. It rejects false owner sign-off, invented verified closures, conflicting counts, or unsupported packet structures. This is *structural consistency validation*, not cryptographic provenance, owner authentication, a remote lookup, or independent confirmation of source evidence.

Staged packets reside only in browser `localStorage` under `dd:admin-evidence-intake:573:v1`. They do not overwrite or silently merge any Build 569, 571 or 572 observations. Owner-entered reports and source references remain unverified. A separate `dd:admin-disposition-draft:573:v1` key stores only explicitly confirmed, local follow-up drafts.

For each open source exception, the reviewer can choose one of four actions:

1. `KEEP_OPEN` — retain the unresolved case for more evidence.
2. `REQUEST_DEVICE_RETEST` — request a real retest on the affected device.
3. `REQUEST_INDEPENDENT_PROOF` — request external source verification.
4. `ESCALATE_SOURCE_FIX` — escalate a reproducible source defect.

The UI suggests a safe next action from the source lane but does not preselect or save it. A manual selection requires a rationale of at least 12 characters and an explicit acknowledgment that it is *not* closure or owner approval. Drafts pin the exact original device, check, original note/time, retest result/detail/time and source reference. Changes or missing source cases make previous drafts **STALE** instead of transferring approval to a different observation.

Copyable readback and JSON packet `devilndove-admin-evidence-intake-573-v1` include the original portable source packet, open-case actions, stale drafts and unreviewed checks. `validateIntakePacket573` recalculates the entire result before accepting it. No `ACCEPT`, `RESOLVE`, `APPROVE` or `CLOSE` action exists.

All states preserve `owner_signoff=PENDING`, `owner_decision=NOT_RECORDED`, `verified_closures=0`, `independent_source_verification=NOT_PERFORMED`, `external_writes=0`, `provider_checks=0` and `d1_queries=0`. Real owner acceptance needs independent source evidence, actual device retest and a separate deliberate owner decision. Do not enter private customer information, credentials, sensitive photographs or access tokens.

## Release gates

- Build 573 tests cover empty/unreviewed evidence, still-failing and missing retest actions, exact imported source matches, stale disposition pins, forged acceptance rejection, structural packet roundtrip, browser-local UI and no network writes.
- Preserve Build 500–572 regressions, Brand V3 wiring and exact Admin route inventory.
- `dev` System Gate with canonical Preview + smoke, Application Quality, I.T. Runtime and Branch Hygiene must be GREEN before merge.
- Production Pages must match main SHA, `build=573`, live Admin assets and custom-domain smoke; independent Production Live Resource Integrity proof must report `PASS` and zero D1 reads.

## Next queued build

**Build 574 — Verified Owner Device Evidence Gap Closure & Admin Acceptance Decision Readiness.** Recheck the authentic owner-supplied evidence gaps and independent source references, keep unproven cases open, and prepare a clearly separated decision-readiness summary without implying approval.
