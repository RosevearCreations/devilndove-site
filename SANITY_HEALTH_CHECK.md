# Sanity Health Check — Release 458

Updated: 2026-08-29

- Current branch: `dev`
- Current release: **458 — Creators / CAIP Private Media, Evidence & Reviewed Handoff Depth**
- Development Pages: `devilndove-site-dev` / `https://devilndove-site-dev.pages.dev`
- Development Pages Production deployment: writable Development application
- Separate live Production: LOCKED / untouched
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Release 458 migration: **NONE**
- Last independently verified schema release: **453**
- Release 453 mutation / verifier: `33258377328` / `33258415391`
- Release 457 exact head: `33f939c8b6daa733e8a54fa8ded15cde626978a0`
- Release 457 Source / System: `33264872362` / `33264872366` — SUCCESS
- Release 457 Cloudflare Pages check: `99133095306` — SUCCESS
- CAIP private R2 binding: `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`
- Temporal evidence authority: `creative_media_evidence_ranges`
- Story evidence/link authority: `creative_story_evidence` + `creative_story_segment_evidence_links`
- Processing artifact authority: `caip_media_processing_artifacts`
- Reviewed Content Studio handoff: `caip_content_handoffs` + `caip_content_handoff_evidence`
- Parallel Release 458 CAIP schema: **FORBIDDEN / NOT REQUIRED**
- Private original copy/overwrite during review/handoff: FORBIDDEN
- Stale/empty Content Studio package review: FORBIDDEN
- Processing completion without verified output artifact: FORBIDDEN
- Release 457 Financials protections: carried forward
- Release 456 Inventory/Tool protections: carried forward
- Release 455 Storefront/SEO protections: carried forward
- Release 454 Admin convergence: carried forward
- Provider execution/publication: CLOSED
- `wrangler.toml account_id`: FORBIDDEN
- Historical migration replay: FORBIDDEN

Release 458 focused Source Gate and canonical System Gate must be green on the exact final `dev` SHA before the release is called source-proven. Authenticated CAIP private-media acceptance remains a separate next-stage requirement after source convergence.
