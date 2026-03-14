/docs/SANITY_HEALTH_CHECK.md
# Devil n Dove Site – Sanity / Health Check

## Current Status
The application is now a **working internal alpha** with the following systems functioning:

### Public Website
- Static site deployed on **Cloudflare Pages**
- Pages include:
  - Home
  - Gallery
  - Creations
  - Tools
  - Supplies
  - Contact
- Data-driven pages using JSON:
  - `/data/tools/toolshed_items_master.json`
  - `/data/site/featured-items.json`

### Assets
Assets served from **Cloudflare R2**.

Examples:
- tool images
- product images
- workshop images
- site branding

---

# Authentication System

Implemented:

- Login
- Logout
- Session tokens
- Password change
- Logout other sessions
- Session expiry tracking

Session model:


users
sessions


Sessions expire using:


expires_at > datetime('now')


---

# Members Area

Members area includes:

- profile display
- password change
- session info
- logout other sessions

Files:


/members/index.html
/public/js/change-password.js
/public/js/logout-all.js
/public/js/session-info.js


---

# Admin Area

Admin dashboard exists with:

### Summary panel
Shows:

- total users
- active users
- inactive users
- admin users
- active sessions

### User management
Admin can:

- create users
- update role
- activate/deactivate accounts
- reset passwords
- delete users

### Safety protections

Implemented protections:

- cannot delete yourself
- cannot delete last admin
- cannot demote yourself from admin
- cannot deactivate yourself

---

# Admin Maintenance

Admin tools include:

- clean expired sessions
- refresh users
- dashboard summary refresh

---

# Working API Endpoints

Auth:


/api/auth/login
/api/auth/logout
/api/auth/logout-all
/api/auth/me
/api/auth/change-password
/api/auth/session-info


Admin:


/api/admin/users
/api/admin/user-update
/api/admin/create-user
/api/admin/reset-password
/api/admin/delete-user
/api/admin/dashboard-summary
/api/admin/cleanup-sessions


---

# Major Issues Found

## Database binding mismatch

Some code uses:


env.DB


but wrangler.toml uses:


DD_DB


This must be standardized.

---

## Duplicate folder trees

Both exist:


/data/
/data/data/


Only one should remain.

---

## Duplicate "me" endpoint

Two versions exist in repo.

Should standardize:


/api/auth/me


---

# Must Fix Before Production

1. Standardize D1 binding
2. Remove duplicate data folders
3. Remove legacy bootstrap code
4. Confirm schema migration path
5. Harden password validation
6. Add rate limiting

---

# Nice-to-Have Improvements

- Admin user search
- Admin pagination
- Admin audit logs
- Asset manager
- Featured creations manager
- Video manager
- R2 upload tool

---

# Overall Health

| Area | Status |
|-----|------|
Public Site | Good
Auth System | Good
Admin Tools | Good
Database Design | Needs consolidation
Security Hardening | Needs improvement
Documentation | Needs improvement

---

# Overall Assessment

The application is a **stable internal alpha**.

With database consolidation and security hardening it will be ready for production.
