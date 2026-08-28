# Build 445 — Repository Retirement and Forward Sanity Gate

Updated: 2026-08-27

Build 445 is the active Devil n Dove Development maintenance release. Its purpose is to remove historical build-report bulk from the deployable repository and make that cleanup permanent.

## Previous exact checkpoint

Build 444 source checkpoint:

`89cda092668cffff5902698bb741624aececf5b1`

Build 444 source and Windows D1 transport gates were GREEN. A final Build 444 inventory-only checkpoint `bcd20b9d018fd9eb4b2608d1b2c1406dfb5bec6c` added no application feature or database mutation; it only exposed the root Build Markdown inventory for this cleanup.

## Environment boundary

- Source: `dev`
- Development runtime/project: `devilndove-site-dev`
- Development D1: `DB` → `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Development R2: `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- Development private R2: `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`
- Separate live Production: `main` / `devilndove-site`
- Production promotion: **CLOSED**

## Build 445 retirement

Build 445 removes `docs/archive/build-history` from the active repository. Historical build reports remain recoverable from Git history and do not need to ship with every Development deployment.

The active root is also required to contain **zero** historical `BUILD*.md` files. Build-specific Markdown belongs only in `docs/releases` while it is current/useful; Git history is the long-term historical authority.

Executable migration, verification and regression artifacts are different from narrative build reports. They may remain when a current gate or guarded correction flow still depends on them. Build 445 explicitly retains the Build 442 I.T. and Build 443 carousel guarded D1 authorities, plus inherited Build 440 transport/product/inventory tests used by current CI.

## Forward rule — Build 445 and later

1. Do not create `BUILD###_CHANGED_FILES.md`, `BUILD###_VALIDATION.md` or other build-report Markdown in the repository root.
2. Do not create a second build-history archive inside the deployable tree.
3. Current release authority belongs under `docs/releases` and should be concise.
4. Historical narrative is Git history, not copied files.
5. Old executable SQL/runners/tests may remain only while a current workflow or correction mechanic still relies on them.
6. Every new release must run `scripts/build445_repository_forward_sanity.py` or its deliberate successor.
7. Build numbers in filenames may identify the origin of a still-required executable artifact; they do not make that artifact obsolete by themselves.

## Build 445 D1/R2 rule

Build 445 adds **no D1 SQL migration** and no R2 mutation. Build 444's read-only infrastructure readiness authority remains the carried runtime mechanism for checking D1/R2 connectivity and the Build 442/443 carried schema state.

## Current carried HOLDs

- `CAR-445-H1` — Build 443 carousel live Development schema/behavior acceptance.
- `IT-445-H1` — Build 442 explicit I.T. user-grant authority and Phase B acceptance.
- `PAY-445-H1` — Stripe Development end-to-end evidence.
- `PAY-445-H2` — PayPal sandbox end-to-end evidence.
- `CAIP-445-H1` — private R2/media evidence.
- `UI-445-N1` — authenticated responsive browser evidence without weakening CSP.
- `OPS-445-H1` — separate live Production promotion remains closed.

## Safety

Build 445 CI has no Cloudflare, D1, R2 or payment-provider write capability. Repository cleanup changes source files only. Production mutation capability remains **NONE**.
