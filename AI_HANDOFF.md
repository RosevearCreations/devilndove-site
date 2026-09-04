# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 46 — Four-Camera Synchronization & Audio Alignment is accepted on Development pending the final documentation/read-only authority closure proof.**

Accepted Build 46 implementation:
- merged `dev` SHA `f72de937342f4d213243f35a278429be078df85d`
- tree `d0eefd5362b167fd01602205915b6966b080af61`
- System Gate `33914234895` SUCCESS
- Current Application Quality `33914234888` SUCCESS
- I.T. Admin Runtime Proof `33914234944` SUCCESS
- Repository Branch Hygiene `33914234946` SUCCESS
- exact canonical Preview deployment, canonical D1 migration proof, Development data-authority read-only proof, binding proof, non-secret smoke acceptance and regression evidence: SUCCESS inside System Gate `33914234895`.

Build 32 remains the independently verified Production baseline:
- Production `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`
- tree `2c1b4a3694779996e1bdb094be5e9e043834276e`
- Production Pages Deploy `33866964958` SUCCESS.

## Build 46 result

Build 46 now provides a focused reviewed Grey Hair synchronization workspace over the existing `caip_capture_groups` and `caip_capture_tracks` authorities. It requires exactly four distinct Build-45-ready private video sources, keeps the anchor among those four cameras at offset `0.000`, allows at most one separate private dedicated audio source, and persists millisecond-resolution offsets, confidence, method, review state and notes.

Initial suggestions use recorded capture timestamps first and source timecode second. If neither produces a comparable timing source, the track remains `manual_required`. Every non-anchor change returns the group to review. A group cannot become confirmed until all four camera tracks and any included audio track are explicitly confirmed and all fail-closed blockers are cleared.

Build 46 does not create a competing synchronization persistence model. It adds no schema or canonical migration and performs no request-time DDL. The canonical D1 migration stream remains exactly `0001`–`0004`. Source originals remain private and immutable; raw public R2 URLs, R2 mutation, waveform/media processing, provider execution and publication remain disabled.

Build 45 remains the private-media intelligence input authority. Build 47 owns AI story selection and edit planning and may consume only a confirmed Build 46 synchronization group. Build 46 performs no story selection, script generation, editing or publication.

`scripts/current_grey_hair_sync_alignment_gate.py` is part of Current Application Quality alongside the Build 45 media-intelligence gate and completed Packaging protections.

## Restart rule

This documentation/read-only Build 46 authority closure must merge to `dev` and independently pass the push-triggered System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene on its exact merged SHA before Build 46 is called fully closed and before Build 47 starts.

After that proof, start **Release 467 Build 47 — AI Story & Edit Planning** from the exact final Build 46 documentation-green `dev` head. Build 47 may consume only confirmed Build 46 synchronization groups and reviewed Build 45 evidence, and must not weaken private-media, provider, publication or Production boundaries.

External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access lanes remain HOLD unless fresh evidence explicitly accepts them. Build 32 remains Production until a deliberate current fully-green Development promotion is explicitly requested and independently proven.
