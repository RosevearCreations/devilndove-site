# Development Cloudflare Connection Authority

## Current authority — Release 462

This file defines the only Cloudflare boundary for ongoing Devil n Dove Development work.

### Source / Pages

- GitHub branch: `dev`
- Cloudflare Pages project: `devilndove-site-dev`
- Development URL: `https://devilndove-site-dev.pages.dev`
- The Pages **Production deployment of `devilndove-site-dev` is the Development application**.
- Separate live `main` / `devilndove-site` is a different Production boundary and remains untouched until deliberate promotion.

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

Before any future D1 write, tooling must verify the exact name and UUID. A friendly-name match alone is insufficient. Release 461 must not be reapplied merely because a chat/session/workstation changed.

### R2

- `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`

Release 462 autonomous work does not require R2 mutation. Raw CAIP R2 deletion remains closed.

## Startup rule

1. read `development-release.json` and `AI_HANDOFF.md`;
2. verify `dev` plus exact Cloudflare identities read-only;
3. do not replay historical migrations;
4. treat Release 461 D1 as already applied unless read-only evidence proves actual drift;
5. treat Release 462 as a source/quality/gate-consolidation release, not a migration event.

## Runtime acceptance boundary

The last authenticated Development runtime proof was Release 461 GET-only acceptance. Its exact-head reproof passed on `e5637bdcc9807e626f0ed5e2828c86898804aed1`.

Release 462 does not authorize D1/R2 writes or provider/payment execution merely because source code changed. A later runtime/provider test must keep its own deliberate evidence boundary.

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
