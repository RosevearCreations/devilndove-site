# Devil n Dove Site – Sanity / Health Check

## Current Status

The application is now a **working internal alpha with commerce foundations in place**.

---

# What Is Working

## Public website

Working public pages include:

- Home
- About
- Gallery
- Creations
- Tools
- Supplies
- Movies
- Contact
- Shop
- Product detail
- Cart
- Checkout
- Order confirmation

## Assets

Assets are served from repo assets and intended R2-backed media workflows.

## Authentication system

Implemented:

- login
- logout
- logout all sessions
- password change
- session expiry checking
- bootstrap admin support

## Members area

Implemented:

- member page
- password change
- session/account tools

## Admin area

Implemented:

### User tools

- create users
- update user role
- activate / deactivate users
- reset passwords
- delete users
- cleanup expired sessions
- dashboard summary

### Safety protections

Still important and expected:

- cannot delete yourself
- cannot deactivate yourself
- cannot demote your own admin role
- last admin must remain protected

### Access tier tools

Implemented:

- load available access tiers
- view user access tiers
- assign access tier
- remove access tier

### Product tools

Implemented:

- create product
- edit product
- archive product
- delete product
- list products in admin

### Orders and payment tools

Implemented:

- list orders
- view order detail
- update order status
- view payment records
- manually record payment

## Storefront and checkout

Implemented:

- public active products API
- product detail API
- product list page
- product detail page
- add to cart
- browser cart
- cart badge
- checkout page
- order creation endpoint
- order confirmation page
- payment preparation endpoint

---

# Database State

## Core auth

Exists via:

- `database_schema.sql`

## Store / orders

Exists via:

- `database_store_schema.sql`

Includes:

- tax classes
- products
- product images
- product tags
- orders
- order items
- order status history

## Access tiers

Exists via:

- `database_access_tiers.sql`

Includes:

- access tiers
- user access tiers

## Payments

Exists via:

- `database_payments_extension.sql`

Includes:

- payments

---

# Major Improvements Since Earlier Project State

The repo is no longer only “site + auth + future store.”

It now has real:

- products
- storefront
- cart
- checkout
- orders
- payment records
- layered user access controls

That is a major maturity step.

---

# Known Gaps / Risks

## Security hardening still needed

Still needed:

- login rate limiting
- stronger password policy
- full admin audit logs
- broader abuse protection

## Payment integrations not live yet

Foundation exists, but real external provider integration is still missing:

- PayPal API flow
- credit card processor flow
- webhook/callback reconciliation

## Shipping and tax are still early-stage

Current order/tax logic is enough for internal alpha, but not the final production logic.

## Bulk product workflow missing

Requested and still needed:

- bulk product upload
- bulk product editing

## Repo cleanup still needed

Watch for:

- duplicate-style data folder usage
- stale docs/path references
- legacy assumptions in older files

---

# Must Fix Before Production

1. real payment integration
2. audit logging
3. login hardening
4. shipping logic
5. improved tax handling
6. bulk product workflow
7. tier-aware protected content behavior

---

# Overall Health

| Area | Status |
|---|---|
| Public Site | Good |
| Auth System | Good |
| Admin User Management | Good |
| Access Tier Foundation | Good |
| Product Management | Good |
| Storefront | Good |
| Cart | Good |
| Checkout Foundation | Good |
| Orders | Good |
| Payment Foundation | Good |
| Live Payment Integration | Not Done |
| Security Hardening | Partial |
| Bulk Product Workflow | Not Done |

---

# Practical Summary

The project is in a much better state than the earlier health check suggested.

It now behaves like a real internal-alpha commerce platform with:

- layered security direction
- admin operations
- order tracking
- payment foundations

The main remaining jump is from **foundation complete** to **production-ready integrations and hardening**.
