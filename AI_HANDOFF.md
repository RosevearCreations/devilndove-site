# Devil n Dove — AI Handoff

## Current verified baseline

Release 467 **Build 170 — Product Browser Explicit Image Recovery** is the last fully verified Development and Production checkpoint.

- `dev` SHA: `879c8730040afaf6caec6374b5057b7261fdcfe2`
- `main` SHA: `879c8730040afaf6caec6374b5057b7261fdcfe2`
- exact tree: `da5e3b249d6e14266da5e191cb22c06205947948`
- System Gate: `35275441340`
- Current Application Quality: `35275441446`
- I.T. Admin Runtime: `35275441412`
- Repository Branch Hygiene: `35275441448`
- Build 170 Development proof: `35275441460`
- Production Pages Deploy: `35275636873`
- Production Live Resource Integrity: `35275711398`
- Products Production Browser Proof: `35275711387`
- Products Route Production Proof: `35275711471`
- Build 170 Production proof: `35275636939`

Build 170 is GREEN. A fresh Product Browser page performs one bounded Product query only. Secondary image recovery is not automatic: a missing photo is checked only when an operator presses **Recover photo**, for exactly one Product. The fallback endpoint does not re-read Product authority, does not list R2, and performs no Product/image mutation.

## Active candidate — Build 171

Release 467 **Build 171 — Release & Restart Authority Convergence** repairs repository truth drift that remained after Product runtime work advanced beyond old Build 154/158/166 handoff records.

Build 171 converges:

- `current-development-authority.json`
- the current I.T. operations control-tower API/client/page
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `MARKDOWN_INDEX.md`
- the Build 170 Production closure authority
- the Build 171 candidate authority and dedicated proof gate

This build changes release/restart truth only. It does **not** change Product runtime behavior, schema, canonical migrations, D1/R2 business data, provider execution/publication, payments, refunds or accounting.

## Restart rule

At the start of every future chat/build:

1. Read `current-development-authority.json`, then this file and `PROJECT_STATUS_AND_ROADMAP.md`.
2. Verify the live GitHub `dev` and `main` refs before relying on any embedded SHA.
3. Treat Build 170 above as the immutable predecessor proof for Build 171.
4. Once Build 171 is promoted, the final Build 171 SHA is the synchronized `dev == main` branch head proven by exact-SHA CI and Production deployment; a candidate file must never self-claim its own final commit SHA.
5. Never re-run historical D1 migrations or mutate Production data unless current read-only verification proves a real drift and the build explicitly authorizes the change.

## Safety / external lanes

Canonical D1 migrations remain `0001`–`0005`. Request-time DDL remains closed. Stripe Development, PayPal sandbox and Social/OAuth remain separate external-acceptance lanes; CAIP private media remains evidence-dependent. Secret values must never be committed or emitted.
