# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 32 — Help, Search & Responsive Convergence is Development GREEN.**

Accepted application runtime: `1b68fed65844938bcee38169bfe7d783abd160d4` / tree `8c76339af56304651c9e81c70bdceea14393ffff`.
Accepted proof: System Gate `33827496687`, Current Application Quality `33827496693`, I.T. Admin Runtime Proof `33827496691`, Repository Branch Hygiene `33827496696` — all SUCCESS on that exact Development SHA.

Build 32 operating boundary:
- Online Help Centre is current and release-neutral; internal Help remains `noindex,nofollow`
- stale/duplicate active files and retired legacy calibration surfaces are removed from the active application
- `/search/` is `noindex,follow`
- sitemap policy is canonical-only and excludes the empty generic product shell
- public pages enforce exactly one H1 in source with a runtime backstop
- responsive safeguards cover phone, tablet, PC/app and wide-web layouts
- password-hash security compatibility remains protected
- schema change: none; canonical migrations remain `0001`–`0004`
- D1/R2/provider/Cloudflare Access mutation: none

## Promotion and restart rule

Do **not** freeze a Production SHA in this handoff. Before starting the next build, verify from current GitHub/CI evidence that `main` carries the exact fully-green Build 32 Development closure tree and that Production has independently passed its exact-source deployment/system proof. If either condition is not true, finish Build 32 promotion/verification first.

External Stripe, PayPal, CAIP private-media, social OAuth and Cloudflare Access HOLD lanes remain deferred unless current evidence explicitly proves acceptance.

After Build 32 is proven GREEN in Production, select Build 33 from current repository evidence; do not reopen completed Build 31/32 work.
