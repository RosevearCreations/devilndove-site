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
