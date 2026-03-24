# Devil n Dove – Project Brain

This file is the fast practical snapshot of the **current repo state**.
It should let a new developer or AI assistant understand the live architecture without guessing.

---

# Project Purpose

Devil n Dove is both:

1. the public website for the workshop and brand
2. the internal management system for members, admin tools, products, orders, payments, and layered access

The project is no longer just a public site plus login. It now has a real commerce and security foundation.

---

# Current Architecture

## Frontend

- static HTML pages
- shared CSS in `/css/styles.css`
- modular vanilla JS in `/public/js/`

## Backend

- Cloudflare Pages Functions in `/functions/api/`

## Database

- Cloudflare D1 / SQLite
- binding name: `env.DB`

## Storage

- Cloudflare R2 for site assets and media

---

# Live Functional Areas

## 1. Public website

Pages include public brand and catalog pages, including shop, cart, checkout, and confirmation.

## 2. Authentication and member system

Implemented:

- register
- login
- logout
- logout all
- change password
- session info
- member page
- bootstrap admin flow

Security model:

- session tokens stored in DB
- API authentication via bearer token
- session expiration checked against `datetime('now')`

## 3. Members area

Implemented:

- protected members page
- session/profile display
- password change tool
- logout-all tool
- member orders list
- member order detail modal
- member downloads foundation

## 4. Admin user and security management

Implemented:

- users list with session counts
- create user
- reset password
- deactivate/delete user foundation
- dashboard summary
- security summary
- cleanup expired sessions

Admin self-protection remains important:

- cannot casually break your own access
- last-admin protection still matters in future refinements

## 5. Product management

Implemented foundation:

- tax classes
- products table for physical and digital items
- product images / tags
- create product
- edit product
- archive product
- delete product
- bulk product update tool
- import preview tool
- storefront only shows active products

Product states:

- `draft`
- `active`
- `archived`

## 6. Storefront

Implemented:

- `/shop/` product grid
- `/shop/product/` detail page
- add to cart from shop or detail page
- cart badge in nav
- `/cart/` review page

Cart model:

- browser localStorage
- no server cart yet

## 7. Checkout and orders

Implemented:

- `/checkout/`
- browser-saved checkout form
- order creation endpoint
- order confirmation page
- order status history
- payment preparation bridge endpoint

Order states supported:

- `draft`
- `pending`
- `paid`
- `fulfilled`
- `cancelled`
- `refunded`

Fulfillment types supported:

- `shipping`
- `digital`
- `mixed`

## 8. Payments foundation

Implemented:

- `payments` table
- admin order payment visibility
- manual/admin payment recording
- payment summary in orders list
- payment preparation endpoint for future provider handoff
- public provider readiness endpoint
- PayPal live handoff path when credentials are configured

Providers currently modeled:

- `paypal`
- `stripe`
- `square`
- `manual`
- `other`

Real provider integration is **not connected yet**.

## 9. Multi-tier access model

There are **two levels of access logic**.

### Core system role

Stored in `users.role`:

- `member`
- `admin`

### Business / content access tiers

Stored separately in `access_tiers` and `user_access_tiers`:

- artist
- customer
- donor
- vip_donor
- subscriber

This separation is the correct long-term design because admin authority should not be overloaded with donor/customer/artist permissions.

---

# Database Files

- `/database_schema.sql`
- `/database_store_schema.sql`
- `/database_access_tiers.sql`
- `/database_payments_extension.sql`

---

# Important Frontend Scripts

## Auth / member scripts

- `auth.js`
- `site-auth-ui.js`
- `login.js`
- `register.js`
- `members-self-protect.js`
- `members.js`
- `member-account-tools.js`
- `change-password.js`
- `member-orders.js`
- `member-order-detail.js`
- `member-downloads.js`
- `bootstrap-admin.js`

## Admin scripts

- `admin.js`
- `admin-dashboard-summary.js`
- `admin-security-summary.js`
- `admin-users.js`
- `admin-create-user.js`
- `admin-reset-password.js`
- `admin-delete-user.js`
- `admin-cleanup-sessions.js`
- `admin-self-protect.js`
- `admin-access-tiers.js`
- `admin-products.js`
- `admin-create-product.js`
- `admin-edit-product.js`
- `admin-delete-product.js`
- `admin-archive-product.js`
- `admin-orders.js`
- `admin-order-detail.js`

## Storefront scripts

- `shop.js`
- `product-detail.js`
- `cart.js`
- `cart-page.js`
- `cart-badge.js`
- `checkout.js`
- `order-confirmation.js`

---

# What Is Still Missing

## Payments

Not done yet:

- PayPal capture completion and webhook reconciliation
- PayPal return / cancel completion handling
- card processor selection and integration
- webhook handling
- payment reconciliation automation

## Product workflow

Not done yet:

- bulk product import
- bulk product editing
- image upload tool to R2 from admin

## Security and operations

Not done yet:

- admin audit logs fully implemented
- login rate limiting
- richer password policy enforcement
- donor/customer/artist gated frontend experiences
- shipping automation
- expanded tax logic

---

# Current Phase

This repo has moved from:

**site + auth prototype**

to:

**internal alpha commerce/admin/member platform with layered access and payment foundation**

That is the right mental model for future work.

## 10. Latest checkout hardening update

Most recent practical improvements:

- checkout now enforces shipping details for physical or mixed orders
- checkout saves a local confirmation snapshot after order creation/payment preparation
- confirmation page can render meaningful order details for guest checkout without requiring authenticated member access

This keeps the current checkout foundation usable before full PayPal/card integrations are connected.


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


## Latest Growth / Security / SEO Pass

Included in this pass:

- analytics/security tracking tables and endpoints for visitors, page views, and cart abandonment
- admin analytics UI for visitor paths, countries, abandonment, and recent visitors
- product SEO and image annotation foundations
- advanced storefront search filters
- saved app settings and notification queue foundations
- site item reorder inventory for tools, supplies, and Amazon-linked items
- bulk finished-product import endpoint and admin UI
- top-right logged-in user account menu

New SQL file to run:

- `/database_growth_analytics_seo_extension.sql`


Also added in this pass:

- `/robots.txt`
- `/functions/sitemap.xml.js`


## Latest pass additions

- richer live monitoring and historical website analytics by visitor token, browser session, country, path, and search events
- PayPal return/capture completion endpoint for confirmation flow
- improved site inventory/reorder admin workflow for tools, supplies, and sellable products
- corrected core `database_schema.sql` for the current `users` / `sessions` app model
- added `database_admin_seed_template.sql` for creating a starter admin account safely
