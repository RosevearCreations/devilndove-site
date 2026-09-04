# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 35 — Production Promotion & Rollback Provenance Convergence is Development GREEN.**

Accepted Build 35 Development implementation:
- SHA `b3fd1777c41f9b459048b441254f2fa762692051`
- tree `c88d7e9fc3f43dcdd6d0e05cbe14c6cc7c3fc461`
- System Gate `33873907300` SUCCESS
- Current Application Quality `33873908526` SUCCESS
- I.T. Admin Runtime Proof `33873907340` SUCCESS
- Repository Branch Hygiene `33873907303` SUCCESS

Build 32 remains the independently verified Production baseline:
- Production `main` `816490a9f36ffc2a730d8149549e5a2fbd609966`
- tree `2c1b4a3694779996e1bdb094be5e9e043834276e`
- Production Pages Deploy `33866964958` SUCCESS.

## Build 35 result

Production promotion no longer trusts a matching Development tree plus System Gate alone. `main_promotion_gate.py` now requires the exact current Development tree to have successful push-triggered System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene evidence before any Production work can proceed.

The active Production workflow now resolves `current-development-authority.json` instead of the stale Release 467 Build 1 I.T. authority. Its existing Production safety chain remains intact: business snapshot, canonical Production D1 migrations, isolated D1 proof, exact-main deployment, Cloudflare binding proof, public smoke and promotion evidence.

Production rollback readiness is now release-neutral and read-only. It does not move `main`, deploy code, reverse schema, restore business data or execute providers. A forward quality guard fails if Production promotion or rollback provenance regresses to stale release-specific contracts.

No Production deployment or rollback was executed by Build 35. No schema change, D1/R2 business-data mutation, provider execution/publication or Cloudflare Access mutation is authorized.

## Restart rule

This authority-only closure and any later authority-only descendant must itself pass push-triggered System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene before Build 36 starts. Build 32 remains Production until a deliberate current fully-green Development promotion is explicitly requested and independently proven.

External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access lanes remain HOLD unless fresh evidence explicitly accepts them.
