# Devil n Dove Website

Official website and management system for **Devil n Dove**.

The project now includes:

- public website pages
- member authentication and session tools
- admin dashboard
- product management
- storefront, cart, checkout, and order confirmation flow
- order management and payment tracking foundations
- multi-tier access controls for artists, customers, donors, and VIP/support tiers

---

# Current Status

Project stage: **internal alpha / commerce foundation in place**

Working now:

- public site pages
- login / logout / session-based auth
- member account area
- admin user management
- admin product create / edit / archive / delete
- shop catalog from active products
- product detail pages
- browser cart with cart badge
- checkout form and order creation
- order confirmation page
- admin order review, status updates, and manual payment recording
- access tier assignment and removal in admin

Not connected yet:

- live PayPal API checkout
- live credit card processor
- shipping rate automation
- tax rules beyond current Ontario estimate foundation
- bulk product import / bulk editing UI

---

# Tech Stack

Frontend

- HTML
- CSS
- Vanilla JavaScript

Backend

- Cloudflare Pages Functions

Database

- Cloudflare D1 (SQLite)

Storage

- Cloudflare R2

Deployment

- GitHub → Cloudflare Pages

---

# Main Areas

## Public site

Examples:

- `/`
- `/gallery/`
- `/creations/`
- `/tools/`
- `/supplies/`
- `/movies/`
- `/contact/`
- `/shop/`
- `/shop/product/`
- `/cart/`
- `/checkout/`
- `/checkout/confirmation/`

## Members area

Examples:

- `/login/`
- `/members/`

## Admin area

- `/admin/`
- `/bootstrap-admin/`

---

# Important Features

## Authentication

- login
- logout
- logout all sessions
- password change
- session info
- bootstrap admin support
- self-protection rules for admin accounts

## Product and storefront system

- tax classes
- product records for physical and digital items
- up to 5 product image URLs per product
- active / draft / archived product states
- public products API
- public product detail API
- admin product management

## Cart and checkout

- browser cart storage
- cart badge
- checkout form persistence in browser
- order creation in D1
- order confirmation page
- payment preparation bridge endpoint

## Orders and payments

- admin orders table
- order detail modal
- order status history
- payment records table
- manual payment recording
- payment summaries in admin orders list

## Access tiers / security layers

Core role system still exists:

- `member`
- `admin`

Separate access tier system now exists for business/content permissions:

- `artist`
- `customer`
- `donor`
- `vip_donor`
- `subscriber`

This separation is intentional so site authority and customer/supporter access do not get mixed together.

---

# Database Files

Schema files now in repo root:

- `/database_schema.sql`
- `/database_store_schema.sql`
- `/database_access_tiers.sql`
- `/database_payments_extension.sql`

---

# Key API Groups

## Auth

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/logout-all`
- `/api/auth/me`
- `/api/auth/change-password`
- `/api/auth/session-info`
- `/api/auth/bootstrap-admin`
- `/api/auth/bootstrap-status`

## Admin users and security

- `/api/admin/users`
- `/api/admin/create-user`
- `/api/admin/user-update`
- `/api/admin/reset-password`
- `/api/admin/delete-user`
- `/api/admin/dashboard-summary`
- `/api/admin/cleanup-sessions`
- `/api/admin/access-tiers`
- `/api/admin/user-access-tiers`
- `/api/admin/assign-user-access-tier`
- `/api/admin/remove-user-access-tier`

## Admin products

- `/api/admin/tax-classes`
- `/api/admin/products`
- `/api/admin/product-detail`
- `/api/admin/create-product`
- `/api/admin/update-product`
- `/api/admin/archive-product`
- `/api/admin/delete-product`

## Storefront / checkout

- `/api/products`
- `/api/product-detail`
- `/api/checkout-create-order`
- `/api/checkout-prepare-payment`

## Admin orders / payments

- `/api/admin/orders`
- `/api/admin/order-detail`
- `/api/admin/order-payments`
- `/api/admin/update-order-status`
- `/api/admin/record-payment`

---

# Development Notes

Recommended local workflow:

```bash
wrangler pages dev
```

Apply schema updates as needed to D1 using your normal SQL prompt / D1 workflow.

---

# Immediate Next Priorities

- connect real PayPal checkout
- choose and connect a card processor
- add order payment completion callbacks / webhooks
- add bulk product upload and bulk product editing
- add stronger audit logging for admin actions
- add shipping logic and refined tax logic

---

# Maintainers

Devil n Dove Workshop

Ontario, Canada
