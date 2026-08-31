# Development Cloudflare Connection Authority

## Current authority — Release 462 Development green

This file defines the only Cloudflare boundary for ongoing Devil n Dove Development work.

### Source / Pages

- GitHub branch: `dev`
- Cloudflare Pages project: `devilndove-site-dev`
- Development URL: `https://devilndove-site-dev.pages.dev`
- The Pages **Production deployment of `devilndove-site-dev` is the Development application**.
- Separate live `main` / `devilndove-site` is a different Production boundary and remains untouched until deliberate promotion.

Release 462 preclosure Pages proof:

- source SHA: `71b58c548e953edbdede1be85e12acd7e30e3422`
- System Gate: run `33348770688` (#526), job `99357890735` — PASS
- Pages check: `99358032459` — PASS
- deployment ID: `3e03d1ee-a427-4d14-b561-59b2980fdf1c`
- preview: `https://3e03d1ee.devilndove-site-dev.pages.dev`

### Cloudflare account

- Approved tooling/CI account ID: `c0d5bc25df16ae5b7d47c985c4b7b787`
- Account selection belongs in local tooling/GitHub Actions environment.
- `wrangler.toml` must never contain `account_id`.

### D1

- binding: `DB`
- database: `devilndove-dev`
- UUID: `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- schema accepted through **Release 461**
- Release 462 has **no D1 migration**
- Release 461 D1 acceptance run: `33340698069`
- proven contract: 77 required tables / 93 required indexes / zero missing objects / zero structural drift / zero FK violations

Before any future D1 write, tooling must verify the exact name and UUID. A friendly-name match alone is insufficient. A new chat/session/workstation/source commit is not a migration event.

### R2

- `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`

Release 462 autonomous work performed no R2 mutation. Raw CAIP R2 deletion remains closed.

## Startup rule

1. Read `development-release.json` and `AI_HANDOFF.md`.
2. Verify `dev` plus exact Development D1/R2 identities read-only.
3. Do not replay historical migrations.
4. Treat Release 461 D1 as already applied unless read-only evidence proves actual drift.
5. Treat Release 462 autonomous source/System/Pages work as closed and Development green.
6. Historical release-specific source/remote workflows are manual archives, not startup actions.
7. New autonomous source feature work begins as Release 463.

## Runtime / external acceptance boundary

The last authenticated Development application runtime proof remains Release 461 GET-only acceptance on `e5637bdcc9807e626f0ed5e2828c86898804aed1`. Release 462 does not claim that separate browser/provider/payment evidence was rerun merely because source/System/Pages acceptance passed.

Release 462 does not authorize D1/R2 writes, OAuth authorization or provider/payment execution. Those require their own deliberate evidence boundaries.

## Secret/configuration boundary

Actual provider values belong in Cloudflare Workers & Pages → `devilndove-site-dev` → Settings → Variables and Secrets. D1/source/Markdown/browser output may contain safe reference names only, never secret/token values.

## Production/provider lock

- Production promotion: **CLOSED**
- provider live authorization: **CLOSED**
- provider execution/publication: **CLOSED**
- payment remote execution: **CLOSED unless deliberately operator-enabled for Development test/sandbox acceptance**
- raw CAIP R2 deletion: **CLOSED**
- live Production D1/R2 mutation from Development workflows: **UNAVAILABLE**

Do not weaken these locks to make an acceptance test easier.
