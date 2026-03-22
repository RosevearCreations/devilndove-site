# Devil n Dove Repo Base Guide

This document explains the current repository structure based on the **latest project state**.

---

# Top Level

Important paths:

- `/admin/`
- `/about/`
- `/bootstrap-admin/`
- `/cart/`
- `/checkout/`
- `/checkout/confirmation/`
- `/contact/`
- `/creations/`
- `/gallery/`
- `/members/`
- `/movies/`
- `/shop/`
- `/shop/product/`
- `/functions/`
- `/public/`
- `/data/`
- `/assets/`
- `/css/`
- `/database_schema.sql`
- `/database_store_schema.sql`
- `/database_access_tiers.sql`
- `/database_payments_extension.sql`
- `/wrangler.toml`

---

# Admin

`/admin`

Admin interface.

Current responsibilities:

- dashboard summary
- user management
- access tier management
- product management
- order review
- order status updates
- payment review and manual payment recording
- maintenance tools

---

# Bootstrap Admin

`/bootstrap-admin`

Used for initial admin account bootstrap flow.

---

# Members

`/members`

Authenticated member area.

Contains or supports:

- profile/session awareness
- password change
- logout all sessions

---

# Shop / Cart / Checkout

`/shop`
`/shop/product`
`/cart`
`/checkout`
`/checkout/confirmation`

These now form the public commerce flow.

Implemented:

- product list
- product detail
- browser cart
- checkout form
- order confirmation

---

# Public JS

`/public/js`

Client-side scripts are modular.

Important scripts include:

- auth and session UI
- admin user scripts
- admin product scripts
- admin access tier scripts
- admin order scripts
- cart scripts
- checkout scripts
- storefront scripts

---

# Functions

`/functions`

Cloudflare Pages Functions.

Key groups:

- `functions/api/auth/*`
- `functions/api/admin/*`
- `functions/api/products.js`
- `functions/api/product-detail.js`
- `functions/api/checkout-create-order.js`
- `functions/api/checkout-prepare-payment.js`

---

# Data

`/data`

Static JSON and related supporting files.

Examples:

- products JSON snapshots
- featured items JSON
- tools and supplies JSON
- workshop catalog source files

Note:

There is still duplicate-style legacy content in places like `/data/data/` inside this snapshot. Cleanup remains a roadmap task.

---

# Assets

`/assets`

Site images, logo files, banners, and other static visual assets.

Large media is intended to live in Cloudflare R2.

---

# CSS

`/css/styles.css`

Main global stylesheet for site and admin pages.

---

# SQL Schema Files

These are now important root-level schema files:

- `database_schema.sql` → auth / users / sessions
- `database_store_schema.sql` → products, tax classes, orders, order items
- `database_access_tiers.sql` → layered access system
- `database_payments_extension.sql` → payments table

---

# Wrangler

`/wrangler.toml`

Cloudflare configuration.

Should define:

- D1 database binding as `DB`
- any R2 bindings used by project
- Pages / Functions behavior

---

# Deployment Flow

```text
GitHub push
↓
Cloudflare Pages build
↓
Functions deploy
↓
Site live
```

---

# Local Development

Recommended:

```bash
wrangler pages dev
```

---

# Repo Direction

This repository is now headed toward:

- stronger security layers
- real payment integrations
- better product workflow tooling
- richer admin operations
- gated features/content by access tier

## Latest Repo Update

The checkout flow now includes:

- stronger frontend validation for physical shipping fields
- matching backend validation in `/functions/api/checkout-create-order.js`
- guest-friendly confirmation support in `/public/js/order-confirmation.js`


## Profile and tier expansion

The repo now includes a dedicated `user_profiles` extension for richer customer and employee records.

Current additions in this pass:
- contact profile storage for address, phone, company, and preferences
- email/phone verification flags
- customer/employee/both profile typing
- employee fields for department, job title, employee code, and emergency contact
- member self-service profile editor
- admin profile manager for users
- expanded access-tier seeds for customer discount tiers and employee tiers

Schema / API additions:
- `/database_profiles_extension.sql`
- `/api/admin/user-profile`
- `/api/member/profile`

This prepares the project for future discount logic, loyalty handling, internal employee records, and deeper CRM-style customer management.
