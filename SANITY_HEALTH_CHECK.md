# Sanity Health Check — Release 455

Updated: 2026-08-29

- Current branch: `dev`
- Current release: **455 — Storefront Discovery, Media Fallback & SEO Depth**
- Writable Development Pages: `devilndove-site-dev` / `https://devilndove-site-dev.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Release 455 migration: **NONE**
- Last independently verified schema release: **453**
- Release 453 mutation: `33258377328`
- Release 453 independent verifier: `33258415391`
- Storefront protected routes: Shop / Product / Collections / Collages
- Shared media fallback: local neutral SVG
- Shared accessibility: alt repair / live status / alert / pressed thumbnails / 44px targets
- Shared responsive media: 900px / 640px / mobile overflow / reduced motion
- SEO: one source H1 + canonical + social metadata + JSON-LD + Product canonical normalization
- Release 454 shared Admin shell: carried forward
- Provider execution/publication: CLOSED
- Separate live Production mutation/promotion: CLOSED
- `wrangler.toml account_id`: FORBIDDEN
- Historical migration replay: FORBIDDEN
- Development copy was synchronized from locked live and is treated as current unless verification proves drift.

Release 455 focused Source Gate and canonical System Gate must both be green on the exact final `dev` SHA before Release 455 is called source-proven. Cloudflare Pages Development deployment must then be green on that same head.
