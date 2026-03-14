# DEVELOPMENT_ROADMAP.md
Devil n Dove Website – Development Roadmap

This document defines the **planned evolution of the Devil n Dove website and application**.

It provides a prioritized roadmap so developers and AI assistants know:

• what to build next  
• what order changes should occur in  
• which improvements are critical vs optional

---

# Current Stage

Project status:

**Internal Alpha**

Working systems:

✔ Public website  
✔ Members authentication  
✔ Session management  
✔ Admin dashboard  
✔ User management  
✔ Session cleanup  
✔ Password reset  
✔ Admin protections  

Core architecture is stable but the repository needs **cleanup and consolidation** before major new features.

---

# Phase 1 — Repository Stabilization (High Priority)

Goal:

Make the repository **clean, predictable, and maintainable**.

### 1. Standardize Database Binding

Some code uses:


env.DB


Other areas use:


DD_DB


This must be standardized.

Recommended:


env.DB


Update:

• wrangler.toml  
• all functions  
• documentation

---

### 2. Remove Duplicate Data Directories

Both exist:


/data
/data/data


Consolidate into:


/data


Update all references.

---

### 3. Consolidate API Endpoints

During development some endpoints were duplicated.

Standardize endpoints:


/api/auth/login
/api/auth/logout
/api/auth/logout-all
/api/auth/me
/api/auth/change-password
/api/auth/session-info

/api/admin/users
/api/admin/create-user
/api/admin/user-update
/api/admin/reset-password
/api/admin/delete-user
/api/admin/dashboard-summary
/api/admin/cleanup-sessions


Remove legacy duplicates.

---

### 4. Confirm Final Database Schema

Verify tables:


users
sessions
admin_logs


Remove any legacy tables.

Add migration documentation.

---

# Phase 2 — Security Hardening (High Priority)

Before production launch.

### 5. Password Security

Add rules:

Minimum length  
Complexity requirements

Example:


minimum 8 characters
uppercase
lowercase
number


---

### 6. Login Rate Limiting

Prevent brute force attacks.

Recommended:


5 attempts / minute


Add tracking table or memory store.

---

### 7. Admin Audit Logging

Create `admin_logs` table.

Log:


user creation
user deletion
role change
password reset
account activation/deactivation


---

### 8. Session Rotation

When password changes:


invalidate all existing sessions


Except current session.

---

# Phase 3 — Admin Content Manager (Major Feature)

Goal:

Replace manual JSON editing with **admin interface tools**.

### 9. Featured Creations Manager

Admin UI to manage:


featured-items.json


Capabilities:

• add item  
• remove item  
• edit item  
• reorder items

---

### 10. Tools Catalog Manager

Admin UI for:


toolshed_items_master.json


Capabilities:

• add tools  
• edit tools  
• update images  
• categorize tools

---

### 11. Supplies Manager

Admin UI for supplies.

Similar to tools system.

---

### 12. Gallery Manager

Upload and manage images.

Features:

• upload to R2  
• delete images  
• reorder gallery

---

### 13. Video Manager

Embed and manage:

• YouTube videos  
• workshop videos

---

# Phase 4 — Workshop Systems (Medium Priority)

Internal workshop tracking tools.

### 14. Inventory Manager

Track:

• tools  
• consumables  
• materials  
• equipment

---

### 15. Tool Location System

Track where tools are located.

Example:


bench
lathe station
casting station
laser station


---

### 16. Consumables Tracker

Track materials:


resin
polymer clay
wax
casting metal


---

# Phase 5 — Public Website Enhancements

### 17. Search

Add site search.

Search:

• tools  
• creations  
• blog posts

---

### 18. Blog System

Add blog for:

• workshop updates  
• tutorials  
• project logs

---

### 19. Creations Catalog

Display all creations.

Include:

• images  
• description  
• tags

---

# Phase 6 — Optional Future Systems

These are **long-term improvements**.

### Online Store

Sell items created in the workshop.

### Member Community

Allow members to:

• comment
• interact
• follow projects

### Project Tracker

Track workshop projects.

---

# AI Development Rules

When implementing roadmap tasks:

AI must:

• follow PROJECT_BRAIN.md  
• follow AI_CONTEXT.md  
• update documentation  
• avoid duplicating endpoints or schemas  
• maintain security protections

---

# Recommended Development Order


Phase 1 – Repository cleanup
Phase 2 – Security hardening
Phase 3 – Admin content manager
Phase 4 – Workshop systems
Phase 5 – Public site improvements
Phase 6 – Future expansions


---

# Maintainers

Devil n Dove Workshop  
Ontario, Canada

Laurie Rosevear  
Jack Rosevear

---

# Roadmap Status

This roadmap will evolve as the project grows.
