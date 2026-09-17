# Devil n Dove — Project Status & Roadmap

## Current checkpoint

Release 467 **Build 170 — Product Browser Explicit Image Recovery** is the last fully verified Development and Production baseline.

- Development SHA: `879c8730040afaf6caec6374b5057b7261fdcfe2`
- Production SHA: `879c8730040afaf6caec6374b5057b7261fdcfe2`
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

Build 170 is GREEN. The compact Product Browser uses one bounded Product query on a fresh page. Missing fallback image recovery is explicit, one-Product-only and non-retrying; there is no automatic secondary image read, Product-table re-read, R2 listing, schema mutation or Product/image mutation.

---

# Build 171 — Release & Restart Authority Convergence — ACTIVE

## Purpose

Remove stale restart/release truth left behind after the Product administration sequence advanced through Builds 166–170. Future chats and release passes must begin from the actual Production baseline rather than old Build 154/158/166 authority text.

## Scope

Build 171 converges the machine pointer, I.T. control-tower identity and primary human handoff documents on the exact Build 170 GREEN baseline. It adds an immutable Build 170 Production closure authority plus a Build 171 candidate authority and dedicated gate.

The build is intentionally operational rather than a Product feature pass. It changes no Product runtime logic, schema, canonical migration, D1/R2 business data, payment/refund/accounting state or external-provider execution/publication.

## Acceptance

Development must be GREEN on one exact Build 171 head across:

- Build 171 dedicated authority-convergence proof
- retained Build 170 Product Browser proof
- current I.T. release-truth gate
- repository forward sanity
- System Gate / exact Development Preview
- Current Application Quality
- I.T. Admin Runtime
- Repository Branch Hygiene

Production promotion is non-force and identical-tree only. After `main` advances, Production must pass:

- Production Pages Deploy
- Production Live Resource Integrity
- retained Products Production Browser Proof
- retained Products Route Production Proof
- Build 171 authority-convergence proof on `main`

Only then may Build 171 be called Production GREEN.

---

## Permanent release/restart rules

1. Verify live `dev` and `main` refs at restart; do not trust stale embedded self-SHAs.
2. A candidate records the exact previously verified checkpoint, never its own not-yet-created final commit SHA.
3. `current-development-authority.json`, I.T. release truth, `AI_HANDOFF.md`, this roadmap and `MARKDOWN_INDEX.md` must agree on build identity and predecessor proof.
4. Promotion remains **EXACT GREEN DEVELOPMENT TREE ONLY** and non-force unless a separately documented emergency procedure explicitly says otherwise.
5. Canonical D1 migrations remain `0001`–`0005` unless a future schema build explicitly changes that authority.
6. Never reapply historical migrations or copy Development business data over Production merely because a new chat started.
7. Request-time schema mutation remains closed.
8. Product/admin/public workflows must remain fail-soft for bounded read-capacity issues and must not silently invent successful authority.
9. Public SEO continues to require one H1 per exposed page.
10. Secrets and provider credentials remain outside source/D1/public files.

---

## Product administration state after Build 170

The current Product path now includes:

- compact Product Browser with explicit paging/search/refresh
- browser-session reuse for revisited Product pages
- one bounded Product query on a fresh browser page
- operator-triggered single-Product fallback photo recovery
- no automatic secondary image recovery reads
- dedicated one-Product Product Editor
- Media tab loading only when opened
- QA loading only when **Run QA** is pressed
- bounded public Product detail/image path
- retained Product route/browser Production proofs

Historical Product repair builds remain provenance only. Do not restart from their older runtime assumptions when Build 170/171 authority is available.

---

## Next direction after Build 171

Once Build 171 itself is Production GREEN, continue feature work from the synchronized Build 171 `dev == main` head. Choose the next bounded scope from current operational evidence rather than stale build numbers. Product runtime changes should preserve the Build 170 low-read contracts unless a measured regression requires a deliberate change.

External provider/evidence lanes remain separate from ordinary application readiness: Stripe Development, PayPal sandbox and Social/OAuth require their own acceptance evidence, while CAIP private media remains evidence-dependent.
