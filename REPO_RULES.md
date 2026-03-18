# REPO_RULES.md

Devil n Dove Repository Rules

These are the operating rules for this repo. They exist to prevent broken architecture, duplicate systems, security regressions, and stale documentation.

---

# Rule 1 — Extend Existing Systems First

Before adding a new endpoint, script, or table, check whether the existing one should be extended.

Examples of existing backend groups:

- auth endpoints
- admin user endpoints
- admin product endpoints
- admin order endpoints
- checkout endpoints

Do not create duplicates because an existing file feels inconvenient.

---

# Rule 2 — Use `env.DB`

The D1 binding name must be:

```js
env.DB
```

Do not introduce alternate binding names.

---

# Rule 3 — Keep Core Roles Separate from Access Tiers

This repo now has two permission layers.

## Core role

Stored on `users.role`:

- `member`
- `admin`

## Business/content access tier

Stored in `access_tiers` and `user_access_tiers`:

- artist
- customer
- donor
- vip_donor
- subscriber

Never collapse these into one system unless explicitly redesigning the security model.

---

# Rule 4 — Do Not Break Admin Safety Protections

Admin safety protections must remain intact.

Critical protections include:

- admin cannot delete themselves
- admin cannot deactivate themselves
- admin cannot demote themselves from admin
- last admin cannot be removed

---

# Rule 5 — Frontend Scripts Stay Modular

Client scripts should remain focused and single-purpose whenever practical.

Examples:

- `admin-products.js`
- `admin-edit-product.js`
- `admin-order-detail.js`
- `cart.js`
- `checkout.js`

Do not merge working specialized scripts into large monoliths without a strong reason.

---

# Rule 6 — Full File Output by Default

When changing code for this repo, default to returning:

- the file path
- the full updated file

Avoid partial snippets unless the user asked for a patch or explanation only.

---

# Rule 7 — One File Per Change by Default

Default workflow is still:

- one file at a time
- brief description
- one full code block per document

This reduces merge confusion and broken state.

---

# Rule 8 — Document Architecture Changes

Whenever architecture meaningfully changes, update the Markdown docs.

At minimum, keep these synchronized:

- `README.md`
- `PROJECT_BRAIN.md`
- `AI_CONTEXT.md`
- `DEVELOPMENT_ROADMAP.md`
- `SANITY_HEALTH_CHECK.md`

If schema changed, also update the relevant SQL documentation files.

---

# Rule 9 — Respect Current Commerce Architecture

This repo already has:

- products
- storefront
- cart
- checkout
- orders
- payments foundation

Do not describe or treat commerce as purely “future” anymore.

At the same time, do not falsely document live PayPal or live card processing as complete. Those are still pending integration work.

---

# Rule 10 — Protected APIs Must Validate Everything

Protected endpoints must enforce:

- auth token presence
- valid session lookup
- active account check
- admin role check where required
- input validation
- safe SQL parameter binding

Never bypass these for convenience.

---

# Rule 11 — Preserve Order and Payment History

Orders, payments, and status history are records.

When extending order/payment systems:

- prefer status/history logging over destructive replacement
- avoid deleting records that should remain auditable
- archive where appropriate

---

# Rule 12 — Products Used in Orders Should Not Be Hard-Deleted Recklessly

If a product is tied to historical orders, prefer archive behavior rather than destructive deletion.

Preserve order history integrity.

---

# Rule 13 — Upcoming Bulk Product Tools Must Follow Existing Store Model

Bulk product upload / bulk editing is on the roadmap.

When added, it must work with the existing tables and model:

- `products`
- `product_images`
- `tax_classes`
- current status workflow
- existing storefront APIs

Do not create a disconnected import-only product system.
