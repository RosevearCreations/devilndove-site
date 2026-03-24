# Repo Rules

- Keep all schema files and Markdown docs in sync with the current build state.
- When payment flow changes, update both code and the database/payment documentation together.
- When media workflow changes, update both admin UI notes and deployment binding notes together.
- Prefer additive changes that preserve working storefront/admin behavior.
- Keep checkout order creation separate from provider-specific payment preparation.
- Treat webhook processing as idempotent, reviewable, and safely replayable.
- Do not remove working PayPal paths when improving Stripe paths.
- Keep product media compatible with both pasted URLs and uploaded R2 assets.
- Keep refund/dispute logging local-first until provider sync is explicitly implemented.
- Keep inventory changes consistent across products, tools, and supplies.
- Use full-file updates for schema/docs when making major pass changes.
