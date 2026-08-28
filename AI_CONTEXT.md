# AI Context — Development Build 446

Current truth lives in `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`.

- Development release: **Build 446** on `dev` for `devilndove-site-dev`.
- Previous fully green/deployed checkpoint: Build 445, SHA `f50e6d61deb31de9c17b12b55d6649a7779fdb95`.
- Build 446 is the deep repository-retirement release: Git history is the archive; old build reports, release snapshots, superseded incremental migrations and inactive build scripts do not ship in the working tree.
- `database_full_schema.sql` is the fresh-install aggregate authority. Only the currently guarded Build 440/442/443 recovery migrations/verifiers remain as standalone incrementals.
- D1/R2 readiness is read-only. Build 446 adds no D1 migration and requires no manual SQL by default.
- Carousel/I.T. schema proof, Stripe, PayPal and CAIP live evidence remain current Build 446 HOLDs until the exact Development runtime proves them.
- Separate live Production is `main` / `devilndove-site`; promotion remains **CLOSED**.
