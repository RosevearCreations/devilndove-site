# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 21 — Release State, Branch & CI Hygiene Convergence is DEVELOPMENT GREEN.**

- merged `dev`: `63c6e90b9637e7953020aa856017bfde3579b47e`
- tree: `8b8ca34e0909d684de6e473007bd976e7948e52b`
- Build 21 Proof `33696534777` — SUCCESS
- System Gate `33696534720` — SUCCESS
- Repository Branch Hygiene `33696535136` — SUCCESS

Build 21 changed repository/release governance only. Build 20 remains the deployed application/runtime and Production authority at runtime tree `550272841e764d77fc21297abede3d4cae1aaea0`; Production `main` is `055cbc973c667b35a209c7ea207779089f6fed3a`, Production Pages Deploy `33688892602` SUCCESS.

## Repository / CI authority

Persistent core branches are `main` and `dev`. Release 467 Build 1–20 proof workflows are retained for deliberate manual historical proof only. The current automatic chain is canonical System Gate + Build 21 proof + Repository Branch Hygiene.

External lanes remain **HOLD_EXTERNAL** unless independently proven: Cloudflare Access service-token acceptance, Stripe Development, PayPal sandbox and Social/OAuth. CAIP private-media remains evidence-dependent. Canada-only fulfillment and the existing U.S. sales/shipping suspension remain intact.

## Restart point

**Start the next bounded Devil n Dove build from current `dev` after Build 21. Do not redo Build 21.** Preserve Production at Build 20 unless a later promotion is explicitly authorized and independently proven. Read `current-development-authority.json` first, then this file, then `release467-build21-release-state-branch-ci-hygiene.json`.
