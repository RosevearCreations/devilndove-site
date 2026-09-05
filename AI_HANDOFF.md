# Devil n Dove — AI Handoff

## Current Development authority

Release 467 Build 51 — **Explicit Content Studio Schema Readiness** has GREEN implementation acceptance:
- `dev` SHA `d62273bd57e0d542a3746b65b9b2ba03b1c8c0f0`
- tree `a5fc48a4b21441dee7e81ecf4685cbad7cc236a6`
- System Gate `33931737250` SUCCESS
- Current Application Quality `33931737252` SUCCESS
- I.T. Admin Runtime Proof `33931737261` SUCCESS
- Repository Branch Hygiene `33931737243` SUCCESS
- exact Development Preview deployment, canonical D1 migration proof, Development data-authority read-only proof, bindings, smoke and regression evidence: SUCCESS.

Build 51 makes the active Content Studio mutation paths consume the explicit read-only `requireContentAutomationSchema` readiness authority directly. The ambiguous legacy `ensureContentAutomationSchema` alias is no longer used by those active routes, and the new regression gate rejects request-time DDL there. No schema migration, renderer/provider execution, publication, social queueing or R2 mutation is authorized.

## Last fully verified restart checkpoint

Build 50 — **Reviewed CAIP to Content Studio Handoff** is the last externally verified exact-branch-head restart checkpoint:
- `dev` SHA `d14e41cf4c1b0c12ce597f6fe3ab05d74901a0fa`
- tree `c01d433a0434e893a8b21d9ffded8587732f9a32`
- System Gate `33931172444` SUCCESS
- Current Application Quality `33931172515` SUCCESS
- I.T. Admin Runtime Proof `33931172403` SUCCESS
- Repository Branch Hygiene `33931172411` SUCCESS
- exact Development Preview acceptance: SUCCESS.

The Build 51 authority closure candidate becomes the next restart checkpoint only after its exact merged `dev` head completes the same four external proofs and exact Preview acceptance. Build 52 must then ingest that externally verified final closure before source mutation.

## Safety and restart rules

Production remains Release 467 Build 32 at `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`, tree `2c1b4a3694779996e1bdb094be5e9e043834276e`, Production Pages Deploy `33866964958` SUCCESS. Do not touch `main` or Production without deliberate promotion authority.

Canonical D1 migrations remain exactly `0001`–`0004`; Build 51 adds no schema migration or request-time DDL. Stripe Development, PayPal sandbox, CAIP private-media evidence, social OAuth and Cloudflare Access remain separate HOLD/evidence-dependent lanes.

Build 52 is not scoped. Do not start it until the exact Build 51 closure head is externally proven and then ingested under `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1`.
