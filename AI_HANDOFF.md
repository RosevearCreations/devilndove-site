# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 47 — AI Story & Edit Planning is accepted on Development pending the final documentation/read-only authority closure proof.**

Accepted Build 47 implementation:
- merged `dev` SHA `091fe5b7c3311bb9fb1bc54218be16952d999e7e`
- tree `9b6f28c4d4963e398adda8e59b2ccf3a8c4167aa`
- System Gate `33916429890` SUCCESS
- Current Application Quality `33916429943` SUCCESS
- I.T. Admin Runtime Proof `33916429939` SUCCESS
- Repository Branch Hygiene `33916430024` SUCCESS
- exact canonical Preview deployment, canonical D1 migration proof, Development data-authority read-only proof, binding proof, non-secret smoke acceptance and regression evidence: SUCCESS inside System Gate `33916429890`.

Build 32 remains the independently verified Production baseline:
- Production `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`
- tree `2c1b4a3694779996e1bdb094be5e9e043834276e`
- Production Pages Deploy `33866964958` SUCCESS.

## Build 47 result

Build 47 provides a review-first Grey Hair story/edit planning workspace over existing CAIP authorities: `caip_story_builder_drafts`, `caip_story_builder_items`, `caip_edit_timeline_drafts` and `caip_edit_timeline_clips`. It creates no competing story/edit persistence model.

Planning is fail-closed on the Build 46 boundary. One confirmed Build 46 group with exactly four confirmed camera tracks is required. Build 47 consumes only active approved temporal evidence from confirmed camera tracks, excludes rejected/purge-requested lifecycle records and rejected footage quality, and retains source evidence IDs throughout story and timeline planning.

Evidence ranking is deterministic and review-first. It uses evidence category, source confidence, footage quality, approved semantic evidence and transcript coverage. Generated story plans remain `draft` until a human explicitly marks them `review` or `approved`; edit-plan generation is blocked before that review.

Story beats remain editable and source-linked. Timeline clips preserve source asset/evidence IDs, source in/out points, camera labels, captions and confirmed synchronization offsets. Every write is followed by a fresh authoritative read-back. If the planned evidence duration exceeds the target, Build 47 surfaces the overflow instead of silently dropping approved story beats.

Build 47 adds no schema or canonical migration and performs no request-time DDL. The canonical D1 migration stream remains exactly `0001`–`0004`. Source originals remain private and immutable; raw public R2 URLs, external AI/LLM provider execution, media rendering, publication and R2 mutation remain disabled.

Build 45 remains the Grey Hair private-media intelligence authority and Build 46 remains the four-camera synchronization/audio alignment authority. `scripts/current_grey_hair_story_edit_planning_gate.py` is part of Current Application Quality alongside those completed protections.

## Restart rule

This documentation/read-only Build 47 authority closure must merge to `dev` and independently pass the push-triggered System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene on its exact merged SHA before Build 47 is called fully closed and before Build 48 starts.

Build 48 remains the next approved Grey Hair CAIP automation continuation, but no narrower exact Build 48 title/scope is recorded in current repository authority. Do not invent or begin that narrower slice until Build 47 final closure is GREEN and the current roadmap is deliberately resolved.

External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access lanes remain HOLD unless fresh evidence explicitly accepts them. Build 32 remains Production until a deliberate current fully-green Development promotion is explicitly requested and independently proven.
