# DEVELOPMENT_ROADMAP.md

Devil n Dove Website – Development Roadmap

This file reflects the project **after** the recent auth, member, checkout, orders, payments, and layered-security work.

---

# Current Stage

Project status: **internal alpha with commerce, member, and security foundation in place**

Working systems now include:

- public website
- member authentication
- session management
- member account tools
- member orders and downloads foundation
- admin dashboard
- user management
- security summary and session cleanup tools
- access tier management
- product management foundation
- storefront
- cart
- checkout form
- order creation
- order confirmation
- admin order review
- order status updates
- payment record foundation

The next work is no longer “start the store.”
The next work is **finish and harden the store + member + security systems**.

---

# Phase 1 — Repository and Documentation Stability

Goal:

Keep the repo predictable and aligned with the real build state.

## 1. Keep root docs synchronized

Maintain these as source-of-truth support files:

- `README.md`
- `PROJECT_BRAIN.md`
- `AI_CONTEXT.md`
- `DEVELOPMENT_ROADMAP.md`

## 2. Confirm wrangler / D1 consistency

Verify:

- `env.DB` used consistently
- D1 binding in `wrangler.toml` matches
- R2 bindings are documented

## 3. Review older references

Remove or update any stale wording that still implies the store or member systems are only future concepts.

---

# Phase 2 — Security Hardening

Goal:

Move from internal alpha safety to stronger real-world protection.

## 4. Stronger password policy

Add/enforce:

- minimum length rules
- improved complexity guidance
- friendly validation messages

## 5. Login rate limiting

Protect against brute-force login attempts.

## 6. Admin audit logging

High priority.

Log actions such as:

- create user
- delete/deactivate user
- role changes
- password resets
- session cleanup
- tier assignments/removals
- product changes
- order status changes
- payment recording

## 7. Member/download security hardening

Add:

- stronger download entitlement checks
- optional signed/expiring delivery links
- tighter controls around digital-file exposure

## 8. Tier-aware protected content rules

Use the access tier system for:

- artist-only areas
- donor/supporter areas
- subscriber-only content
- special customer/VIP content

---

# Phase 3 — Payments Completion

Goal:

Turn the payment foundation into real checkout flows.

## 9. PayPal integration

Implemented foundation:

- provider readiness endpoint
- live order handoff path when credentials are configured

Still needed:

- return/cancel completion handling
- capture completion update in DB
- webhook reconciliation

## 10. Card processor integration

Choose provider and implement:

- hosted checkout or tokenized payment flow
- success/failure handling
- payment record update

## 11. Payment callbacks / webhooks

Add provider verification endpoints and reconcile order/payment status safely.

---

# Phase 4 — Order and Fulfillment Operations

Goal:

Improve fulfillment and customer visibility.

## 12. Fulfillment workflow tools

Add admin tools for:

- mark fulfilled
- shipping reference / tracking fields
- fulfillment notes
- digital delivery handling

## 13. Stronger member order history

Expand member account features with:

- richer order detail
- payment progress messaging
- fulfillment/tracking visibility

## 14. Member downloads expansion

Add:

- secure delivery rules
- downloadable asset metadata
- expiry / access control options

---

# Phase 5 — Product Workflow Expansion

Goal:

Make product management practical for real use.

## 15. Bulk product upload

Implemented foundation:

- JSON import preview

Still needed:

- CSV or JSON import commit step
- validation report improvements
- preview before insert confirmation

## 16. Bulk product editing

Implemented foundation:

- status updates in bulk
- inventory updates in bulk
- shipping/tax flag cleanup in bulk

Still needed:

- price updates in bulk
- archive/unarchive presets
- richer selection/filter workflow

## 17. Image upload workflow

Move from raw URL-only management toward:

- R2 upload support
- image assignment UI
- better gallery handling

---

# Phase 6 — Store Logic Improvements

Goal:

Improve checkout accuracy.

## 18. Shipping logic

Implement:

- shipping rules
- physical vs digital handling
- order-based shipping calculations

## 19. Tax logic expansion

Current order creation uses a workable estimate foundation.

Expand to:

- more explicit tax-class handling
- province/country-aware rules where needed
- exemptions and special cases if business requires them

---

# Phase 7 — Admin UX Improvements

Goal:

Make the dashboard easier to use daily.

## 20. Search, filters, pagination

Needed for:

- users
- products
- orders

## 21. Better order detail tools

Potential additions:

- inline payment actions
- printable invoice / packing slip
- resend confirmation later if email is added

## 22. Dashboard metrics expansion

Potential additions:

- total orders
- pending orders
- paid orders
- unpaid totals
- product counts
- active sessions / security alerts

---

# Must-Have Priorities

These should stay near the top:

1. login hardening
2. audit logs
3. real PayPal integration
4. card processor integration
5. member download security
6. bulk product upload and bulk editing
7. shipping/tax improvements
8. tier-aware protected content

---

# Nice-to-Have Later

- customer account enhancements
- coupons/discount system
- inventory alerts
- digital delivery automation
- better media manager
- email notifications

## Recent Progress Update

Completed in the latest pass:

- stronger checkout validation for physical and mixed carts
- backend shipping-field enforcement during order creation
- guest-friendly confirmation rendering through saved checkout confirmation data

This moves the project slightly farther along the **checkout/security pass** phase from the roadmap.


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
