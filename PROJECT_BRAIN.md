# Devil n Dove – Project Brain

This file is the fast, practical snapshot of the **current repo state**.
It should let a new developer or AI assistant understand the live architecture without guessing.

---

# Project Purpose

Devil n Dove is both:

1. the public website for the workshop and brand
2. the internal management system for members, admin tools, products, orders, payments, and layered access

The project is no longer just a public site plus login. It now has a real commerce foundation.

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

Pages include:

- home
- about
- gallery
- creations
- tools
- supplies
- movies
- contact

JSON-driven site content still exists for tools, supplies, featured items, and related catalog data.

## 2. Authentication and member system

Implemented:

- register support in backend
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

## 3. Admin user management

Implemented:

- create user
- update role and active state
- reset password
- delete user
- dashboard summary
- cleanup expired sessions

Admin self-protection exists:

- cannot delete self
- cannot deactivate self
- cannot demote self from admin
- last admin protection remains important

## 4. Product management

Implemented:

- tax classes
- products table for physical and digital items
- product images table
- product tags table
- admin create product form
- edit existing product
- delete product
- archive product
- storefront only shows active products

Product states:

- `draft`
- `active`
- `archived`

## 5. Storefront

Implemented:

- `/shop/` product grid
- `/shop/product/` detail page
- add to cart from shop or detail page
- cart badge in nav
- `/cart/` review page

Cart model:

- browser localStorage
- no server cart yet

## 6. Checkout and orders

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

## 7. Payments foundation

Implemented:

- `payments` table
- admin order payment visibility
- manual/admin payment recording
- payment summary in orders list
- payment preparation endpoint for future provider handoff

Providers currently modeled:

- `paypal`
- `stripe`
- `square`
- `manual`
- `other`

Real provider integration is **not connected yet**.

## 8. Multi-tier access model

The repo now uses **two levels of access logic**.

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

This is the correct long-term design because admin authority should not be overloaded with donor/customer/artist permissions.

---

# Database Files

## Core auth schema

- `/database_schema.sql`

## Store / commerce schema

- `/database_store_schema.sql`

Adds:

- `tax_classes`
- `products`
- `product_images`
- `product_tags`
- `orders`
- `order_items`
- `order_status_history`

## Access tiers schema

- `/database_access_tiers.sql`

Adds:

- `access_tiers`
- `user_access_tiers`

## Payments extension

- `/database_payments_extension.sql`

Adds:

- `payments`

---

# Important Frontend Scripts

## Auth / member scripts

- `auth.js`
- `site-auth-ui.js`
- `login.js`
- `members.js`
- `change-password.js`
- `logout-all.js`
- `session-info.js`

## Admin scripts

- `admin.js`
- `admin-dashboard-summary.js`
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

- real PayPal order/session creation
- PayPal return / cancel handling
- card processor selection and integration
- webhook handling
- payment reconciliation automation

## Product workflow

Not done yet:

- bulk product import
- bulk product editing
- image upload tool to R2 from admin
- product search / pagination in admin

## Security and operations

Not done yet:

- admin audit logs fully implemented
- login rate limiting
- richer password policy enforcement
- donor/customer/artist gated frontend experiences
- shipping automation
- tax expansion beyond current Ontario estimate foundation

---

# Current Best Understanding of Project Phase

This repo has moved from:

**site + auth prototype**

to:

**internal alpha commerce/admin platform with layered access and payment foundation**

That is the right mental model for all future work.
