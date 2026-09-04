# Devil n Dove — Project Status and Roadmap

## Current release

**Release 467 Build 32 — Help, Search & Responsive Convergence is GREEN on Development.**

Accepted Development application runtime:
- SHA `1b68fed65844938bcee38169bfe7d783abd160d4`
- tree `8c76339af56304651c9e81c70bdceea14393ffff`
- System Gate `33827496687` SUCCESS
- Current Application Quality `33827496693` SUCCESS
- I.T. Admin Runtime Proof `33827496691` SUCCESS
- Repository Branch Hygiene `33827496696` SUCCESS

Build 32 converges the current Online Help Centre, active-file hygiene, search indexing rules, canonical sitemap policy, exactly-one-H1 enforcement and responsive phone/tablet/PC/wide-web safeguards. It also preserves the Build 31 password-hash hardening regression boundary.

No schema migration, D1 business-data mutation, R2 mutation, provider execution/publication, Cloudflare Access mutation or automatic Production promotion was introduced. Canonical migrations remain exactly `0001`–`0004`.

## Production boundary

Production state must be determined from **current** branch/deployment evidence, not from a hard-coded historical SHA in this roadmap. Before Build 33 begins, require both:
1. `main` carries the exact fully-green Build 32 Development closure tree; and
2. Production independently passes its exact-source deployment/system proof for that tree.

If either proof is missing, Build 32 remains the active release and promotion/verification must be completed first.

## Next

After Build 32 is independently GREEN in Production, select Build 33 from current repository evidence. Do not reopen Build 31/32 or superseded earlier prerequisites unless a current regression proves they are broken.
