# Devil n Dove Application

Devil n Dove is a Cloudflare Pages application with Pages Functions, D1, R2, an installable web/PWA client, and separate operational workspaces for Storefront, Creator/Socials, Finance and I.T.

## Current operating authorities

- Development source: `dev`
- Production source: `main`
- Production promotion rule: only the exact green Development tree may be promoted
- Canonical D1 migration stream: `migrations/canonical/`
- Current operator help: `/admin/help/`
- Current navigation manifest: `data/admin-navigation-modules.json`
- Source/system acceptance: `.github/workflows/system-gate.yml`
- Current UX/search/help acceptance: `.github/workflows/current-application-quality.yml`
- Production deployment: `.github/workflows/production-pages-deploy-current.yml`
- Branch cleanup: `.github/workflows/repository-branch-hygiene.yml`

Historical release/build evidence remains available in Git history and retained authority JSON. It is not a current instruction set and should not be copied forward into new UI labels, help text or workflow names.

## Database policy

The canonical migration stream is the only forward D1 schema authority:

1. `0001_release464_migration_authority.sql`
2. `0002_release464_operational_acceptance.sql`
3. `0003_release464_business_growth.sql`
4. `0004_release465_storefront_quality.sql`

Request-time DDL is forbidden. Development migration/read-only proofs run before Development deployment. Production snapshots business data and proves the same canonical convergence before dependent code is deployed.

## Public search and content rules

- exactly one H1 on every indexable public page
- useful title and meta description
- clean HTTPS `devilndove.com` canonical
- sitemap contains canonical indexable public destinations only
- internal search, account/admin and empty template surfaces are not index targets
- real product pages own product-specific metadata and structured data
- descriptive image alternative text and crawlable internal links
- mobile and desktop expose equivalent important content

## Responsive application rules

The shared responsive convergence layer applies to public pages, PWA/app views and admin workspaces. New or changed interfaces must remain usable at phone, tablet, laptop/PC and wide desktop widths, with contained media, wrapping navigation/grids, practical touch targets and bounded table scrolling.

## Security boundary

Passwords are stored as one-way hashes and are never displayable as existing plaintext. Eye controls only reveal a password currently typed or generated in an input. Secret values must not be committed, displayed in help, or stored in visible integration reference fields.

## External acceptance

Provider configuration is not provider acceptance. Stripe, PayPal, social OAuth, private-media and Cloudflare Access acceptance remain separate HOLD lanes until current real evidence proves them.
