# Release 467 Build 107 — Storefront Discovery & Collection Improvements

## Starting authority

Build 107 consumes the final external Build 106 closure:
- Development SHA `e22b3f9c7fcb223114b48e52a51e0c537e6da081`
- tree `334d907d8e39dcbc8a02dc80cfa949abf13bd8c5`
- System Gate `34655258282`
- Current Application Quality `34655258284`
- I.T. Admin Runtime Proof `34655258283`
- Repository Branch Hygiene `34655258294`
- Production Pages Deploy `34655379475`
- Production Live Resource Integrity `34655438506`

Build 106 is Production GREEN. Build 107 is a new closure candidate and may not self-claim its later external exact-head proof.

## Buyer discovery improvements

Build 107 keeps one Product authority and adds permanent buyer-facing paths on both Shop and Collections:

- **Under $25** — existing `max_price_cents=2500` Product filter.
- **One-of-a-kind** — requires explicit one-of-a-kind, one-off or unique-piece public evidence.
- **Local pickup** — requires an explicit public pickup eligibility field or public pickup wording.
- **Custom gifts** — requires explicit custom, personalization, made-to-order or bespoke evidence.
- **Vintage finds** — existing `merchandise_origin=vintage` Product filter.
- **Laser engraved** — requires explicit laser/engraving evidence in public Product facts.
- **Workshop experiments** — requires explicit experiment, prototype, test-piece or process-study evidence.
- **Proof-rich Products** — requires existing public material/process/locality proof, approved trust evidence or an existing social-ready proof signal.

The `discover=` paths are shareable URL state and filter only the Product payload already loaded by the established Shop runtime. A zero-result path explains that evidence is insufficient rather than silently broadening the meaning.

## SEO and authority boundary

Shop and Collections remain crawlable public pages and each retains exactly one H1. The discovery cards are ordinary crawlable anchors so buyers and search engines can reach useful intent paths without JavaScript-generated navigation being the only route.

Collections remain merchandising views only. They do not own or duplicate Product price, inventory, images, checkout truth, manufacturing claims or SEO Product facts.

## Safety boundary

- Additional Product API/database read: **NONE**
- Additional Storefront-merchandising request: **NONE**
- Product/Inventory mutation: **NONE**
- D1/R2 mutation: **NONE**
- Schema change: **NONE**
- Canonical migrations: exactly `0001`–`0004`
- Provider execution/publication: **NONE**
- Marketplace publication: **NONE**
- Automatic Production promotion: **NONE**
- Canada-only CA/CAD commerce remains authoritative; U.S. sales/shipping remain disabled and local pickup remains supported.

## Closure rule

Build 107 requires exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/bindings and exact Preview smoke. Only that exact fully GREEN SHA/tree may be fast-forwarded non-force to `main`; Production Pages Deploy and Production Live Resource Integrity must then prove the same SHA/tree. Build 108 — Mobile Workshop Assistant must ingest Build 107's final external closure.
