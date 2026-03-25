# Repo Rules

- Keep all schema files and Markdown docs in sync with the current build state.
- When payment flow changes, update both code and the database and payment documentation together.
- When media workflow changes, update both admin UI notes and deployment binding notes together.
- Prefer additive changes that preserve working storefront and admin behavior.
- Keep checkout order creation separate from provider-specific payment preparation.
- Treat webhook processing as idempotent, reviewable, and safely replayable.
- Do not remove working PayPal paths when improving Stripe paths.
- Keep product media compatible with both pasted URLs and uploaded R2 assets.
- Keep refund and dispute logging local-first until provider sync is explicitly implemented.
- Keep inventory changes consistent across products, tools, and supplies.
- Inventory quantity changes should log a movement record whenever practical.
- Use full-file updates for schema and docs when making major pass changes.
- Every outward-facing page must have exactly one H1.
- Every outward-facing page must ship with a title, meta description, canonical URL, and clear robots intent.
- Private utility pages should normally remain `noindex`.
- Review sitemap, robots.txt, and public search visibility on every pass that touches public pages.
- Treat public search awareness as an ongoing improvement requirement for future updates.
- Keep a visible shared footer on every page unless a page is intentionally standalone.
- Keep the shared logged-in account widget available on every page.
- Logged-out account UI should continue to expose login, forgot-password, and forgot-email paths.

- A valid admin/member session should remain visible across both the admin area and the outward-facing site.
- Shared auth should not depend on one storage mechanism alone; keep a reliable session fallback for standard pages.
- Footer injection is part of baseline shared layout and should remain visible after every pass.
- Keep outward-facing pages visually consistent with uniform input, table, and card styling.

- Keep product mass upload template, field rules, and import validation aligned whenever import fields change.
- Continue staged migration of duplicated JSON collections into D1 when it reduces search, inventory, or analytics failure points.
- Outward-facing collection pages should prefer live database-backed catalog data when available, with JSON fallback only as a safety net during migration.
- Keep structured data aligned with visible page content and avoid marking up hidden or misleading content.
- Keep canonical intent, robots intent, favicon support, and public search discoverability aligned with current Google Search guidance on every outward-facing SEO pass.
