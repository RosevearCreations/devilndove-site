# Devil n Dove — AI Handoff

## Current Development authority

Release 467 Build 50 — **Reviewed CAIP to Content Studio Handoff** has GREEN implementation acceptance:
- `dev` SHA `dddd7c9423132dd22b179348a5644362f7b9f46c`
- tree `1d5d4859c55fae404a79eb8cef85e1e0d3f30826`
- System Gate `33930359847` SUCCESS
- Current Application Quality `33930359835` SUCCESS
- I.T. Admin Runtime Proof `33930359865` SUCCESS
- Repository Branch Hygiene `33930359956` SUCCESS
- exact Development Preview deployment, canonical D1 migration proof, Development data-authority read-only proof, bindings, smoke and regression evidence: SUCCESS.

Build 50 re-proves an exact Build 48 `ACCEPTED_FOR_CONTROLLED_PRODUCTION` planning package, requires its existing Creative Process identity, and writes reviewed evidence/story/timeline IDs, timecodes, camera labels and sync offsets into the existing Content Studio review authority. The destination stays `ready_for_review / needs_review`; rendering, provider execution, publication, social queueing and R2 mutation remain closed.

## Last fully verified restart checkpoint

Build 49 — **Current Authority Convergence & Restart Integrity** is the last externally verified exact-branch-head restart checkpoint:
- `dev` SHA `28307cd8939329db05dab61c336d0c7a49f8759e`
- tree `0120c5ca4ccaabb00f3f4ef6f685ae0f8fabcaf7`
- System Gate `33929301077` SUCCESS
- Current Application Quality `33929301018` SUCCESS
- I.T. Admin Runtime Proof `33929301051` SUCCESS
- Repository Branch Hygiene `33929300999` SUCCESS
- exact Development Preview acceptance: SUCCESS.

The Build 50 authority closure candidate becomes the next restart checkpoint only after its exact merged `dev` head completes the same four external proofs and exact Preview acceptance. The following build then ingests that externally verified final closure before source mutation.

## Safety and restart rules

Production remains Release 467 Build 32 at `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`, tree `2c1b4a3694779996e1bdb094be5e9e043834276e`, Production Pages Deploy `33866964958` SUCCESS. Do not touch `main` or Production without deliberate promotion authority.

Canonical D1 migrations remain exactly `0001`–`0004`; Build 50 adds no schema or request-time DDL. Stripe Development, PayPal sandbox, CAIP private-media evidence, social OAuth and Cloudflare Access remain separate HOLD/evidence-dependent lanes.

Build 51 is not scoped. Do not start it until the exact Build 50 closure head is externally proven and then ingested under `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1`.
