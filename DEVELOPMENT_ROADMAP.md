# DEVELOPMENT_ROADMAP.md

Devil n Dove Website – Development Roadmap

This file reflects the project **after** the recent store, checkout, orders, payments, and layered-security work.

---

# Current Stage

Project status: **internal alpha with commerce/admin foundation in place**

Working systems now include:

- public website
- members authentication
- session management
- admin dashboard
- user management
- access tier management
- product management
- storefront
- cart
- checkout form
- order creation
- order confirmation
- admin order review
- order status updates
- payment record foundation

The next work is no longer “start the store.”
The next work is **finish and harden the store + security systems**.

---

# Phase 1 — Repository Stabilization

Goal:

Make the repo predictable and clean enough for long-term work.

## 1. Standardize data directory usage

Current snapshot still suggests duplicate-style data trees in places.

Target:

- one canonical `/data/` structure
- remove `/data/data/` duplication once references are confirmed

## 2. Confirm wrangler / D1 consistency

Verify:

- `env.DB` used consistently
- D1 binding in `wrangler.toml` matches
- R2 bindings are documented

## 3. Review legacy docs and old path references

Some docs still mention `/docs/` and older “future store” wording.

Keep root-level docs and SQL references accurate.

---

# Phase 2 — Security Hardening

Goal:

Move from internal alpha safety to stronger real-world protection.

## 4. Stronger password policy

Add/enforce:

- minimum length
- better complexity rules
- friendly validation messages

## 5. Login rate limiting

Protect against brute-force login attempts.

## 6. Admin audit logging

High priority.

Log actions such as:

- create user
- delete user
- role changes
- status changes
- password resets
- tier assignments/removals
- product changes
- order status changes
- payment recording

## 7. Tier-aware protected content rules

Use the new access tier system for:

- artist-only areas
- donor/supporter areas
- subscriber-only content
- special customer/VIP content

---

# Phase 3 — Payments Completion

Goal:

Turn the current payment foundation into real checkout flows.

## 8. PayPal integration

Implement:

- provider order/session creation
- redirect or hosted payment flow
- return/cancel handling
- payment completion update in DB

## 9. Card processor integration

Choose provider and implement:

- hosted checkout or tokenized payment flow
- success/failure handling
- payment record update

## 10. Payment callbacks / webhooks

Add provider verification endpoints and reconcile order/payment status safely.

---

# Phase 4 — Order Operations

Goal:

Improve fulfillment and admin operations.

## 11. Fulfillment workflow tools

Add admin tools for:

- mark fulfilled
- shipping reference / tracking fields
- fulfillment notes
- digital delivery handling

## 12. Customer order visibility

Later phase, but planned:

- customer order history page
- order status display for logged-in users

---

# Phase 5 — Product Workflow Expansion

Goal:

Make product management practical for real use.

## 13. Bulk product upload

Requested and important.

Add:

- CSV or JSON import
- validation report
- preview before insert

## 14. Bulk product editing

Add:

- status updates in bulk
- price updates in bulk
- inventory updates in bulk
- archive/unarchive in bulk

## 15. Image upload workflow

Move from raw URL-only management toward:

- R2 upload support
- image assignment UI
- better gallery handling

---

# Phase 6 — Store Logic Improvements

Goal:

Improve checkout accuracy.

## 16. Shipping logic

Implement:

- shipping rules
- physical vs digital handling
- order-based shipping calculations

## 17. Tax logic expansion

Current order creation uses a workable Ontario estimate foundation.

Expand to:

- more explicit tax-class handling
- province/country-aware rules where needed
- exemptions and special cases if business requires them

---

# Phase 7 — Admin UX Improvements

Goal:

Make the dashboard easier to use daily.

## 18. Search, filters, pagination

Needed for:

- users
- products
- orders

## 19. Better order detail tools

Potential additions:

- inline payment actions
- printable invoice / packing slip
- resend confirmation later if email is added

## 20. Dashboard metrics expansion

Potential additions:

- total orders
- pending orders
- paid orders
- unpaid totals
- product counts

---

# Must-Have Priorities

These should stay near the top:

1. login hardening
2. audit logs
3. real PayPal integration
4. card processor integration
5. bulk product upload and bulk editing
6. shipping/tax improvements
7. tier-aware protected content

---

# Nice-to-Have Later

- customer account order history
- coupons/discount system
- inventory alerts
- digital delivery automation
- better media manager
- email notifications
