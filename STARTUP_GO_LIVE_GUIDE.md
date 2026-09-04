# Devil n Dove Operational Readiness and Go-Live Guide

This document is the current release-neutral operating guide. Historical numbered launch checklists remain in Git history only.

## Before promotion

1. Start from `dev`.
2. Run the canonical System Gate and Current Application Quality Proof.
3. Confirm canonical Development D1 convergence and the read-only business-data proof succeed.
4. Confirm the exact Development Preview deploy, bindings and public smoke acceptance are green.
5. Review `/admin/help/`, `/admin/application-sanity/`, `/admin/deployment-preflight/` and `/admin/deploy-readiness/` for unresolved current blockers.
6. Keep external provider lanes on HOLD unless current real acceptance evidence exists.

## Search and public quality

For every indexable public route:

- one H1
- useful title and description
- clean canonical URL
- index/follow only when the page is a real search destination
- valid structured data where the page type supports it
- useful crawlable links
- descriptive media alternative text
- equivalent important content on phone and desktop

Internal search, account/admin routes and empty product templates are not sitemap targets.

## Responsive acceptance

Review changed interfaces at phone, tablet, 1024px desktop/app and wide desktop widths. Navigation and grids wrap, media stays inside its container, tables scroll inside bounded regions, and touch controls remain practical.

## Production promotion

1. Promote only the exact green Development tree to `main`.
2. Production snapshots current business data before migration/deployment work.
3. Apply/prove the canonical migration stream.
4. Prove Production D1/R2/environment isolation.
5. Deploy the exact main SHA.
6. Prove bindings through the Cloudflare control plane.
7. Run public Production smoke acceptance.
8. Record promotion evidence only after the full chain is green.

No main-only application patch is an acceptable shortcut.
