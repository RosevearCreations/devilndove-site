# AI_CONTEXT.md

Devil n Dove Website – AI Operational Context

This document is for AI assistants working inside this repository.
Its job is to stop confusion, duplicated work, stale assumptions, and architecture drift.

---

# What This Repo Is Now

Do **not** treat this as only:

- a static site
- a members login demo
- a future store concept

It is now all of the following:

- public website
- members auth system
- members account/order/download foundation
- admin management dashboard
- product management system
- storefront
- cart and checkout foundation
- order management system
- payment-record foundation
- multi-tier access control foundation
- security hardening foundation

---

# Working Mental Model

There are **three major layers** in this project.

## 1. Public site layer

HTML pages for visitors, products, cart, checkout, and general brand content.

## 2. Auth / admin authority layer

Who is allowed into protected pages and admin APIs.

Core roles are still simple:

- `member`
- `admin`

## 3. Business access tier layer

Who gets extra content or capabilities as an artist, donor, customer, subscriber, etc.

These are **not the same thing as admin roles**.

Current access tier codes:

- `artist`
- `customer`
- `donor`
- `vip_donor`
- `subscriber`

When working on permissions, AI must preserve this separation.

---

# Technology Stack

Frontend

- HTML
- CSS
- Vanilla JavaScript

Backend

- Cloudflare Pages Functions

Database

- Cloudflare D1 (SQLite)
- binding name must be `env.DB`

Storage

- Cloudflare R2

Deployment

- GitHub → Cloudflare Pages

---

# Repository Structure

Important top-level files and folders include:

- `/admin/`
- `/bootstrap-admin/`
- `/cart/`
- `/checkout/`
- `/functions/`
- `/login/`
- `/register/`
- `/members/`
- `/public/js/`
- `/shop/`
- `/data/`
- `/assets/`
- `/css/`
- `/database_schema.sql`
- `/database_store_schema.sql`
- `/database_access_tiers.sql`
- `/database_payments_extension.sql`

Root markdown docs are the main repo-level documentation set.

---

# Backend Routing Conventions

## Auth endpoints

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/logout-all`
- `/api/auth/me`
- `/api/auth/change-password`
- `/api/auth/session-info`
- `/api/auth/bootstrap-admin`
- `/api/auth/bootstrap-status`

## Admin user and security endpoints

- `/api/admin/users`
- `/api/admin/create-user`
- `/api/admin/user-update`
- `/api/admin/reset-password`
- `/api/admin/delete-user`
- `/api/admin/dashboard-summary`
- `/api/admin/security-summary`
- `/api/admin/cleanup-sessions`
- `/api/admin/access-tiers`
- `/api/admin/user-access-tiers`
- `/api/admin/assign-user-access-tier`
- `/api/admin/remove-user-access-tier`

## Admin product endpoints

- `/api/admin/tax-classes`
- `/api/admin/products`
- `/api/admin/product-detail`
- `/api/admin/create-product`
- `/api/admin/update-product`
- `/api/admin/archive-product`
- `/api/admin/delete-product`
- `/api/admin/bulk-update-products`
- `/api/admin/import-products-preview`

## Storefront / checkout endpoints

- `/api/products`
- `/api/product-detail`
- `/api/checkout-create-order`
- `/api/checkout-prepare-payment`
- `/api/payment-providers`

## Admin order / payment endpoints

- `/api/admin/orders`
- `/api/admin/order-detail`
- `/api/admin/order-payments`
- `/api/admin/update-order-status`
- `/api/admin/record-payment`

## Member account / commerce endpoints

- `/api/member/orders`
- `/api/member/order-detail`
- `/api/member/downloads`

Before creating a new endpoint, AI should first check whether an existing endpoint should be extended instead.

---

# Frontend Script Rules

Scripts in `/public/js/` are modular and mostly single-purpose.

AI should preserve that pattern.

Examples:

- `admin-products.js` = product listing behavior
- `admin-edit-product.js` = edit behavior for shared product form
- `cart.js` = cart storage helper
- `checkout.js` = checkout page behavior
- `admin-order-detail.js` = modal logic for one order
- `member-order-detail.js` = member modal logic for one order

Do not collapse many working modules into one giant file unless explicitly asked.

---

# Database Architecture

## Core auth tables

From `/database_schema.sql`:

- `users`
- `sessions`

## Store tables

From `/database_store_schema.sql`:

- `tax_classes`
- `products`
- `product_images`
- `product_tags`
- `orders`
- `order_items`
- `order_status_history`

## Access tier tables

From `/database_access_tiers.sql`:

- `access_tiers`
- `user_access_tiers`

## Payment table

From `/database_payments_extension.sql`:

- `payments`

When AI changes architecture, it must keep docs and schema references synchronized.

---

# Security Model

## Authentication

- session token stored in DB
- browser sends bearer token for protected API calls
- valid session must satisfy `expires_at > datetime('now')`

## Admin protection

Every admin endpoint must check:

- bearer token exists
- session is valid
- user is active
- user role is `admin`

## Member protection

Member endpoints/pages must check:

- bearer token exists
- session is valid
- user is active
- user role is `member` or `admin`

## Important design principle

Admin authority and customer/donor/artist access are separate systems.
Do not solve donor/customer/artist access by stuffing everything into `users.role`.

---

# Commerce Model

## Product states

- `draft`
- `active`
- `archived`

## Order states

- `draft`
- `pending`
- `paid`
- `fulfilled`
- `cancelled`
- `refunded`

## Fulfillment types

- `shipping`
- `digital`
- `mixed`

## Payment statuses

- `pending`
- `authorized`
- `paid`
- `failed`
- `cancelled`
- `refunded`
- `partially_refunded`

---

# Current Gaps AI Must Respect

These are **foundations**, not completed provider integrations:

- checkout is real
- PayPal live handoff can be attempted when credentials are configured
- capture completion and webhook reconciliation are still not finished
- manual payment recording exists, but automated provider confirmation is not live yet
- member downloads exist as a foundation, but not as a full secure delivery platform
- order admin exists, but shipping fulfillment tooling is still basic

Do not document these as complete third-party integrations.

---

# Required Output Behavior for AI Sessions

When making code changes in this repo, default to:

- one file at a time
- full file output, not patches unless asked
- keep working architecture intact
- extend existing systems instead of rebuilding them
- update markdown docs when architecture meaningfully changes

---

# High-Priority Upcoming Work

AI should assume these are near-term priorities:

- PayPal integration
- card processor integration
- payment callback / webhook handling
- bulk product upload and bulk product editing
- audit logging
- stronger security hardening
- gated content/features using access tiers

# Latest Checkout Note

AI should now treat guest confirmation as partially supported through a client-side confirmation snapshot.

Implications:

- confirmation pages should not assume member auth is always available
- physical or mixed checkout flows must enforce shipping fields before order creation
- checkout hardening should preserve both guest and member purchase paths


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
