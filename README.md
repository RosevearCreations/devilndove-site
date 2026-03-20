# Devil n Dove Website

Official website and management system for **Devil n Dove**.

## What this repo is now

This is no longer just a public site with a login page. It is now a working internal-alpha web app with:

- public website pages
- DB-backed auth and session handling
- member area with account tools, orders, and downloads foundation
- admin dashboard with user, product, order, payment, and security tooling
- storefront, cart, checkout, and confirmation flow
- layered access foundations for business/content tiers

## Current status

Project stage: **internal alpha / commerce and security foundation in place**

Working now:

- public site pages
- register / login / logout / logout-all
- session info and password change
- bootstrap-first-admin flow
- member account area
- member orders list and order detail modal
- member downloads foundation
- admin dashboard
- admin user listing, create, reset password, deactivate/delete foundation, session cleanup, and security summary
- admin product management foundation
- shop catalog from active products
- product detail pages
- browser cart with cart badge
- checkout form and order creation
- order confirmation page
- admin order review, status updates, and manual payment recording
- payment preparation bridge for future providers
- access tier assignment and removal in admin

Not connected yet:

- live PayPal checkout
- live card processor checkout
- payment callbacks / webhooks
- shipping automation
- tax rules beyond the current estimate foundation
- bulk product import / bulk editing UI
- full admin audit logging

## Stack

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

## Main areas

Public pages include:
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

Member pages include:
- `/login/`
- `/register/`
- `/members/`

Admin pages include:
- `/admin/`
- `/bootstrap-admin/`

## Core systems

### Authentication
- register
- login
- logout
- logout all sessions
- change password
- session info
- bootstrap admin support
- bearer-token auth backed by DB sessions

### Storefront and checkout
- product catalog
- product detail
- browser cart
- cart badge
- checkout form persistence
- order creation in D1
- order confirmation page
- payment preparation bridge

### Orders and payments
- admin orders table
- admin order detail modal
- order status history
- payment records table
- manual payment recording
- payment summaries in admin orders list
- member order visibility foundation

### Members
- protected member page
- profile/session display
- password change tool
- logout-all tool
- order history list
- member order detail modal
- downloads foundation for digital items

### Access tiers
Core role system:
- `member`
- `admin`

Separate business/content access tiers:
- `artist`
- `customer`
- `donor`
- `vip_donor`
- `subscriber`

## Database files
- `/database_schema.sql`
- `/database_store_schema.sql`
- `/database_access_tiers.sql`
- `/database_payments_extension.sql`

## Key API groups

Auth
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/logout-all`
- `/api/auth/me`
- `/api/auth/change-password`
- `/api/auth/session-info`
- `/api/auth/bootstrap-admin`
- `/api/auth/bootstrap-status`

Admin users and security
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

Admin products
- `/api/admin/tax-classes`
- `/api/admin/products`
- `/api/admin/product-detail`
- `/api/admin/create-product`
- `/api/admin/update-product`
- `/api/admin/archive-product`
- `/api/admin/delete-product`

Storefront / checkout
- `/api/products`
- `/api/product-detail`
- `/api/checkout-create-order`
- `/api/checkout-prepare-payment`

Admin orders / payments
- `/api/admin/orders`
- `/api/admin/order-detail`
- `/api/admin/order-payments`
- `/api/admin/update-order-status`
- `/api/admin/record-payment`

Member account / commerce
- `/api/member/orders`
- `/api/member/order-detail`
- `/api/member/downloads`

## Immediate next priorities
- connect real PayPal checkout
- choose and connect a card processor
- add provider callbacks / webhooks
- add audit logging for admin actions
- harden security further
- add shipping logic and refined tax logic
- add bulk product upload and bulk product editing
- expand gated content using access tiers
