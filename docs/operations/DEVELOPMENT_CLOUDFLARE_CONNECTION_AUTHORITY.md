# Development Cloudflare Connection Authority

## Current authority — Release 461

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
- schema accepted through Release 461
- Release 461 D1 acceptance run: `33340698069`
- Release 461 contract: 77 required tables / 93 required indexes / zero missing objects / zero FK violations

Before any future D1 write, tooling must verify exact name and UUID. A friendly-name match alone is insufficient. Release 461 must not be reapplied merely because a chat/session/workstation changed.

### R2

- `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`

Release 461 acceptance did not mutate R2 and raw CAIP R2 deletion remains closed.

## Startup rule

1. read `development-release.json` and `AI_HANDOFF.md`;
2. verify `dev` plus exact Cloudflare identities read-only;
3. do not replay historical migrations;
4. treat Release 461 D1 as already applied unless read-only evidence proves actual drift;
5. new source feature work begins as Release 462.

## Runtime acceptance boundary

Release 461 authenticated runtime acceptance is GET-only against `https://devilndove-site-dev.pages.dev`.

The workflow prefers `DND_DEV_SESSION_COOKIE` when configured. If it is absent, the approved fallback uses the proven Cloudflare credential to verify exact Development D1 identity and perform a **read-only SELECT** for an existing unexpired active admin session. It creates no session, masks the token immediately, never commits/prints it, and then performs only HTTPS GET acceptance.

Runtime acceptance run `33342752757` passed. No D1 write, R2 write, provider action, publication, raw CAIP delete, or separate live Production mutation occurred.

## Secret/configuration boundary

Actual provider values belong in Cloudflare Workers & Pages → `devilndove-site-dev` → Settings → Variables and Secrets. D1/source/Markdown/browser output may contain only safe reference names, never secret/token values.

## Production/provider lock

- Production promotion: **CLOSED**
- provider live authorization: **CLOSED**
- provider execution: **CLOSED**
- provider publication: **CLOSED**
- raw CAIP R2 deletion: **CLOSED**
- live Production D1/R2 mutation from Development workflows: **UNAVAILABLE**

Do not weaken these locks to make an acceptance test easier.
