# Build 444 — Development Infrastructure Recovery Authority Release Gate

Updated: 2026-08-27

Build 444 is the active Devil n Dove Development release. Build 443 remains the exact previous source checkpoint; unresolved carousel, I.T., payment and CAIP work is carried forward as explicit Build 444 **HOLDs** rather than being described as old-build work.

## Previous exact checkpoint

Build 443 source checkpoint:

`c5aa6541ec8574c2054578dce765546af9265f7c`

Evidence on that SHA:
- Build 443 System Convergence Gate: **GREEN**
- D1/R2 readiness endpoint and I.T. bridge: **source-gated**
- Development D1/R2 bindings are canonical in `wrangler.toml`
- Separate live Production mutation capability: **NONE**

## Environment boundary

- Source: `dev`
- Development runtime/project: `devilndove-site-dev`
- Development D1 binding: `DB`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Development public/media R2 binding: `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- Development private CAIP R2 binding: `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`
- Separate live Production: `main` / `devilndove-site`
- Production promotion: **CLOSED**

## Build 444 infrastructure increment

Build 444 makes Development infrastructure authority durable inside the application:
- the authenticated I.T. page owns the operator-facing D1/R2 readiness record;
- D1 readiness performs only `SELECT`/SQLite schema reads;
- R2 readiness performs only one-object `list` probes;
- the endpoint does not create incident rows, apply DDL, write objects, mutate providers or expose secret values;
- the readiness result verifies the carried Build 442 `app_module_user_access` authority and Build 443 `home_carousel_slides` / `home_carousel_events` authority by table presence before any migration is considered;
- missing carried tables report the original hard-pinned Development correction runner instead of encouraging a blind reapply;
- the I.T. page carries all unresolved release obstacle IDs forward to Build 444 while keeping original Build 442/443 filenames as provenance.

**Build 444 adds no new D1 SQL migration.**

That statement applies to the Build 444 infrastructure increment itself. If the live readiness probe later proves that a carried Build 442/443 table is absent, the original guarded migration remains a separate current-release HOLD and must be applied/verified against the exact Development D1 authority before its feature can pass.

## Current HOLD register

| ID | Origin | Hold | Exact remaining proof | Impact |
| --- | --- | --- | --- | --- |
| CAR-444-H1 | Build 443 carousel authority | Carousel tables/live behavior not yet accepted on the exact Build 444 Development deployment | Read Build 444 infrastructure status first; only if the two carousel tables are missing use `python scripts/build443_apply_development_home_carousel.py`; then prove draft/preview/publish/pause/schedule/fallback | **HOLD** |
| IT-444-H1 | Build 442 I.T. authority | Explicit I.T. user-grant table/runtime enforcement not yet accepted on the exact Build 444 Development deployment | Read Build 444 infrastructure status first; only if `app_module_user_access` is missing use `python scripts/build442_apply_development_it_platform.py`; then prove exact grants and isolation | **HOLD** |
| PAY-444-H1 | Stripe Development evidence | End-to-end test checkout evidence incomplete | Test configuration + owner-controlled checkout + return + signed webhook + duplicate replay | **HOLD** |
| PAY-444-H2 | PayPal Development evidence | End-to-end sandbox checkout evidence incomplete | Sandbox configuration + owner-controlled approval/capture + return + verified webhook + duplicate replay | **HOLD** |
| CAIP-444-H1 | CAIP private media evidence | Private R2/media acceptance incomplete | Private delivery + byte/range + exact temporal evidence + verified artifact/storage audit | **HOLD — promotion blocking** |
| UI-444-N1 | Responsive evidence | Source acceptance retained; automated authenticated viewport evidence incomplete | Suitable top-level authenticated viewport evidence without weakening CSP | **NOTE — no known defect** |
| OPS-444-H1 | Promotion policy | Separate live Production promotion intentionally closed | Explicit owner authorization after promotion-blocking HOLDs resolve | **HOLD BY POLICY** |

## D1/R2 correction mechanic

1. Deploy the exact Build 444 `dev` source to `devilndove-site-dev`.
2. Sign in as an authorized administrator and open `/admin/it-platform/`.
3. Use **Verify D1 / R2 now**.
4. Require the `DB`, `PRODUCT_MEDIA_BUCKET` and `CAIP_PRIVATE_MEDIA_BUCKET` cards to identify the exact Development resources and report reachability.
5. Read the carried-schema status before considering any migration. Never re-run a migration solely because its originating build number is old.
6. If the readiness result reports no carried tables missing, no D1 SQL action is required.
7. If a carried table is missing, use only its recorded guarded Development runner and its read-only verification file; never use CI or request-time DDL as a workaround.
8. Record exact source SHA, Development deployment id and non-secret acceptance evidence before clearing the related HOLD.

## Safety boundary

Build 444 source CI has no Cloudflare write step and no Production mutation path. The readiness endpoint is deliberately read-only. No Build 444 action may mutate `main`, `devilndove-site`, Production D1/R2, or Production payment configuration without a separate explicit promotion authorization.
