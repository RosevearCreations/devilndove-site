# Release 467 • Build 569 — Admin Device Feedback Closure & Owner-Safe Acceptance Readback

## Outcome and acceptance boundary

Build 568 corrected the observed desktop double-banner issue and the source-verified narrow-screen artwork and mobile seller-dock offsets. Its technical Production deployment and independent integrity proof passed. **No actual owner phone/tablet feedback or authenticated owner acceptance was supplied for this next build.** The owner cannot be signed off by an automated check.

Build 569 therefore closes the *feedback-intake tooling gap*, not the independent owner/device acceptance gate. A dedicated responsive `/admin/device-acceptance/` worksheet gives the owner concrete workspaces to inspect and a safe way to record desktop, phone, and tablet observations. It is linked from the real Admin Dashboard and Product Editor.

## Manual acceptance readback

| Area | Owner action | Evidence boundary |
| --- | --- | --- |
| Product identity & Save | Check an existing Product, Save and reload it on the real device | Worksheet cannot save or create Product records |
| Four Product areas | Check touch and keyboard navigation between Details, Recipe, Photos, Destinations | No automated approval from tab state |
| Photos & Etsy | Compare original photos, rights, exact stored Etsy draft ID and the actual provider separately | No Etsy/provider request or draft creation |
| Banner & mobile dock | Inspect image text at phone width and Search/Resume above the seller dock | Browser observation, not an inferred test result |
| Commerce, Workshop, Management | Check actual card/action/readback experience in linked Admin workspaces | No inventory, accounting or external posts |

All nine checks start as `not-reviewed` for each of three device classes (27 pending observations). The owner may manually record `observed-ok` or `needs-correction`, with a short note and time. Entries remain **browser-local** under the dedicated Build 569 storage key until deliberately saved. The UI can copy a readable summary or an exact JSON transfer packet. Import combines nonconflicting device observations and refuses collisions rather than silently replacing prior notes. A separate explicit checkbox is required to clear the browser-only worksheet.

The readback packet uses `owner_signoff: PENDING` regardless of human-entered observation rows. A user's `observed-ok` is a note, not independent authentication, provider receipt, Product identity proof or permission to publish. The worksheet has no fetch/XHR/beacon, no form submission, no API mutation, no external posting, no remote storage and no automatic syncing across devices. Do not paste passwords, customer data, private media or credentials into notes. A full owner sign-off must happen separately after actual device and source review.

## Regression and promotion plan

- Require new Build 569 Node source/logic tests: 27 pending by default, safe status/readback, untrusted packet rejection, conflict-safe merging, accessible responsive markup, exact Admin navigation and no remote writes.
- Retain all previous Product Entry, Etsy exact draft and manual channel limits; update inherited tests only for the new build identity and immutable Production marker.
- Regenerate the deterministic 151-route Admin inventory and require its byte-for-byte `--check`.
- Pass Development System Gate (source check and Preview), Current Application Quality, I.T. Admin Runtime, and Repository Branch Hygiene before merging the exact dev tree into main.
- Pass Production Pages, live `release-version.json` Build 569 and exact merge SHA, public resource readback, and independent Production Live Resource Integrity Proof with zero Production D1 reads.

## Owner follow-up still needed

**PENDING owner device sign-off.** Open `/admin/device-acceptance/` on desktop and phone, inspect the workspaces, save or copy the observations and share them. Any reported issue becomes a targeted correction candidate; no issue is called closed without a real retest.

## Next queued

**Build 570 — Owner Device Observation Triage & Verified Admin Fix Follow-Up.** Use only authentic owner-provided device notes to prioritize specific fixes and read back the resulting changes; leave provider publishing and owner sign-off gated until separately evidenced.
