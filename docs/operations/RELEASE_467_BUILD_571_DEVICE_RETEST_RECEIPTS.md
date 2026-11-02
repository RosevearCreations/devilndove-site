# Release 467 • Build 571 — Owner Device Retest Receipts & Admin Exception Resolution Review

## Scope and evidence truth

Build 570 created the local Admin owner-device triage queue and corrected same-tab links that could discard unsaved notes. No fresh owner phone or desktop retest observations were supplied with Build 571. Therefore **no real device exception, verified fix, provider event or owner sign-off is claimed**. Production GREEN proves deployment and resource integrity, not physical-device acceptance.

## Source-pinned browser-local retest receipts

The existing `/admin/device-acceptance/` page now has section 5. It shows only correction candidates from the owner-saved Build 569 worksheet. The owner must:

1. Open the affected Admin workspace in another tab and retest the issue on the same device.
2. Explicitly choose **Still reproduces** or **Appears fixed — independent proof pending**.
3. Enter at least 12 characters describing the actual retest and select an explicit personal-device checkbox.
4. Save a dedicated Build 571 browser-local receipt. This operation does not modify the original Build 569 feedback packet.

A receipt retains the exact source device, check, original note and timestamp, new self-reported result, short details and a retest timestamp. On readback, the comparison accepts a receipt only while the current source observation is still a `needs-correction` for the identical device/check/note/time. If the source was edited or removed, the receipt becomes **STALE** and must not be used as closure evidence.

Readback distinguishes `still-failing`, `appears-fixed`, awaiting-retest and stale records. All are still open pending independent source verification, actual owner-device comparison and explicit sign-off. `verified_closures=0`, `owner_signoff=PENDING`, `external_writes=0`, `provider_checks=0` are invariant. A forged `ACCEPTED` packet or `verified-closed` state fails validation; duplicate and short-note receipts are rejected.

Only browser `localStorage` is written under a dedicated Build 571 key. No remote read/write, API call, D1/R2, Product Save, Etsy draft, Inventory movement, Finance posting or social publication is performed. Live notes use safe `textContent`, not HTML interpolation. No secret, customer data or private photo should be entered into notes.

## Verification and release gates

- New Build 571 Node regressions exercise empty/pending, exact matching, stale after source edit, fake approval rejection, explicit retest fields, no network/write side effects and cache-version coherence.
- Preserve Build 500–570 regression suite, Brand V3 wiring and byte-accurate Admin inventory `--check`.
- Require Development System Gate including Preview deploy, Current Application Quality, I.T. Runtime and Branch Hygiene GREEN before exact `dev → main` merge.
- Require Production Pages, exact `build=571` / `branch=main` / merge SHA marker, resource HTTP/readback and independent Production Live Resource Integrity Proof with zero D1 reads.

## Remaining owner input

To close a concrete issue in a subsequent build, the owner must supply the original and retest readbacks and confirm the actual device behavior after source correction. This build provides an evidence path; it does not authenticate an owner or perform independent retesting.

## Next queued

**Build 572 — Source-Matched Retest Exception Reconciliation & Owner Acceptance Evidence Packet.** Compare authentic before/after owner receipts, keep stale or unresolved exceptions open, and package a clear no-posting acceptance readback for a separate owner decision.
