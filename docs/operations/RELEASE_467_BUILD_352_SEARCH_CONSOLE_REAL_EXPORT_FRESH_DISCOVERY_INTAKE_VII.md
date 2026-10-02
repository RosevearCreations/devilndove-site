# Release 467 Build 352 — Search Console Real Export & Fresh Discovery Intake VII

Build 352 succeeds exact Build 351 Development/Production GREEN and keeps the renewed Builds 349–354 roadmap moving from observed evidence only.

## Search Console contract

- Only an explicitly confirmed real Google Search Console CSV may be imported.
- Freshness is based on the report date, not import or creation time.
- The actionability window remains 30 days.
- A CSV without a Date column requires an explicit report end date.
- Stale or unsupported evidence cannot justify SEO queue/apply decisions.
- No synthetic discovery rows, automatic queue generation, automatic SEO wording, automatic SEO apply, IndexNow execution, provider execution, R2 mutation or Production D1 contact occur in this build.

## Etsy Development connection repair

The Etsy panel now waits for a server-verified administrator session before calling protected I.T. endpoints. A cached/provisional admin identity is no longer enough to trigger the Etsy status read.

The Connect Etsy button no longer appears to do nothing when authorization prerequisites are closed. The protected status API returns safe blocker labels only (never secret values or tokens), and the UI shows the exact next action. OAuth remains Development-only, PKCE-protected, admin initiated, and listing writes/publication remain locked.

The Cloudflare Insights `/cdn-cgi/rum` CORS/404 console warning is external and non-blocking; it is not used as the Etsy OAuth failure signal. The Report-Only CSP warning is likewise non-blocking for this flow.

## Successor

Next: **Build 353 — Maker Story Advancement & Publication Readiness Continuity VI**.
