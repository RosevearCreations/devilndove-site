# Release 467 • Build 570 — Owner Device Observation Triage & Verified Admin Fix Follow-Up

## Evidence boundary and actual correction

Build 569 shipped the browser-local, no-write Admin device worksheet. No physical-device owner review or newly signed acceptance has been supplied in this request, so Build 570 does **not** invent a device problem, an approved fix or a final owner signature.

Source inspection of the Build 569 worksheet revealed one concrete usability risk: each "Open this Admin workspace" link navigated the current tab, so unsaved in-memory observations could disappear before the owner saved them. Build 570 opens the exact existing Admin workspace in a separate tab with `noopener noreferrer` and explicit accessible new-tab wording; the worksheet stays available for note entry. This changes no Product editor, D1, Inventory, Finance or provider logic.

## New owner-safe follow-up queue

The existing `/admin/device-acceptance/` page now adds section 4. The owner deliberately saves notes to browser-local storage, then asks for a follow-up queue. No background reads, remote provider calls or writes occur. Build 570:

- Validates the same Build 569 review packet; refuses any forged `owner_signoff` or unknown device/check/status.
- Lists only explicitly selected `needs-correction` observations as **owner-reported, unverified candidates**. Text is rendered using `textContent`, never inserted as HTML.
- Suggests **P1** for mobile Product entry/tabs/dock and any Etsy exact-ID concern; all other candidates start at **P2**. The priority is a triage suggestion, not evidence of actual severity.
- Requires concrete details for verification. Empty-note candidates say `DETAILS_REQUIRED`; a note says only `OWNER_NOTE_RECORDED_NOT_VERIFIED`.
- Associates each candidate with its existing safe Admin route and a specific *read-only comparison / manual retest* step. Source correction, owner device retest and closure remain unperformed.
- Keeps the untouched pool pending (27 checks initially across desktop, phone and tablet), distinguishes `observed-ok` from independent acceptance, and always reports `verified_fixes_closed=0`, `owner_signoff=PENDING`, `external_writes=0`, `remote_provider_checks=0`.
- Produces a copyable local follow-up summary so the owner can share actual notes for a future targeted build. It never mutates the saved device-review records.

Both scripts reference the same `?v=570` module URL so the Build 569 worksheet initializes once; the CSS/JS URLs are revised to reach existing cached browsers. No API, D1/R2 migration, remote draft, payment, Inventory adjustment, messaging or social post is added.

## Verification and release gates

- New pure Build 570 regression tests check empty/pending behavior, note/priority sorting, forged packet rejection, no closure, exact versioned dependency, new-tab correction and absence of network writes.
- Retain inherited Build 500–569 test contracts, Brand V3 wiring and deterministic Admin route inventory (`--check`).
- Require Development System Gate + deploy-development, Current Application Quality, I.T. Admin Runtime, Repository Branch Hygiene, then exact `dev → main` merge.
- Require Production Pages Deploy, the immutable live `release-version.json` with Build 570 and the exact main SHA, new live worksheet resources and independent Production Live Resource Integrity Proof with zero D1 reads.

## Owner action still required

Open the [Admin device worksheet](/admin/device-acceptance/) on a real desktop/phone, record any issue, **Save review on this browser**, and build/copy the follow-up queue. The owner must share that readback for targeted source investigation and then actually retest any correction on the affected device. Production GREEN verifies release safety, not owner-device sign-off or Etsy publication.

## Next queued

**Build 571 — Owner Device Retest Receipts & Admin Exception Resolution Review.** Compare authentic reported issues against verified fixes and explicit device retest evidence, retain unresolved items and refuse inferred approval or provider publication.
