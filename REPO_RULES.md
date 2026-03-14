# REPO_RULES.md
Devil n Dove Repository Rules

This document defines the **non-negotiable architectural rules** for this repository.

Its purpose is to prevent:

• broken architecture  
• duplicated systems  
• security regressions  
• inconsistent code

All developers and AI assistants must follow these rules.

---

# Rule 1 — Do Not Duplicate Endpoints

Existing endpoints must always be reused.

Auth endpoints:


/api/auth/login
/api/auth/logout
/api/auth/logout-all
/api/auth/me
/api/auth/change-password
/api/auth/session-info


Admin endpoints:


/api/admin/users
/api/admin/create-user
/api/admin/user-update
/api/admin/reset-password
/api/admin/delete-user
/api/admin/dashboard-summary
/api/admin/cleanup-sessions


If functionality already exists, **modify the existing endpoint instead of creating a new one**.

---

# Rule 2 — One Database Schema Only

The database schema is defined in:


/docs/database_schema.sql


Primary tables:


users
sessions
admin_logs


New tables must be documented in the schema file.

Never create undocumented tables.

---

# Rule 3 — Database Binding Name

The database binding name must always be:


env.DB


Wrangler configuration must match this.

Example:


[[d1_databases]]
binding = "DB"


Do not introduce alternate binding names.

---

# Rule 4 — Do Not Break Admin Safety Protections

Admin protections must always remain in place.

Required protections:

• admin cannot delete themselves  
• admin cannot deactivate themselves  
• admin cannot demote their own role  
• last admin account cannot be deleted

These protections are critical for system safety.

---

# Rule 5 — Frontend JavaScript Must Stay Modular

Client scripts must remain **single responsibility modules**.

Examples:


auth.js
admin-users.js
admin-delete-user.js
session-info.js
change-password.js


Each script should do **one job only**.

Avoid large monolithic scripts.

---

# Rule 6 — Always Output Complete Files

When modifying code:

Always provide the **entire file**.

Never provide partial snippets unless explicitly requested.

Correct format:


File:
/public/js/admin-users.js


Followed by a full code block.

---

# Rule 7 — One File Per Change

Each response or change should modify **one file at a time** unless explicitly instructed otherwise.

This prevents:

• merge conflicts  
• broken builds  
• lost code

---

# Rule 8 — Do Not Rewrite Working Systems

If a system is already functioning, do not replace it unnecessarily.

AI should:

• improve  
• extend  
• refactor safely

Not rebuild working features.

---

# Rule 9 — Respect Repository Structure

Directory structure must remain consistent.


admin/
members/
functions/
public/
data/
assets/
css/
docs/


New directories should only be added if absolutely necessary.

---

# Rule 10 — Documentation Must Be Updated

Whenever architecture changes:

Update documentation in:


PROJECT_BRAIN.md
AI_CONTEXT.md
DEVELOPMENT_ROADMAP.md
database_schema.sql


Documentation must stay synchronized with code.

---

# Rule 11 — Security First

Security must always be prioritized.

Required protections:

• input validation
• authentication checks
• role verification
• session expiration
• SQL injection prevention

Never bypass security for convenience.

---

# Rule 12 — Follow Cloudflare Architecture

This project is built for Cloudflare.

Do not introduce frameworks that break compatibility.

Backend:


Cloudflare Pages Functions


Database:


Cloudflare D1


Storage:


Cloudflare R2


Keep architecture **Cloudflare-native**.

---

# Rule 13 — Prefer Incremental Improvements

Large rewrites should be avoided.

Preferred workflow:


small improvements
tested changes
stable evolution


---

# Rule 14 — JSON Content Must Be Structured

JSON files used by the site must remain predictable.

Example:


/data/tools/toolshed_items_master.json
/data/site/featured-items.json


When editing JSON:

• maintain consistent structure  
• do not break existing fields

---

# Rule 15 — Future Systems Must Integrate With Admin

Any future content systems must integrate with the **admin dashboard**.

Example:


featured creations manager
tools manager
supplies manager
gallery manager
video manager


Manual JSON editing should eventually be eliminated.

---

# Final Rule — Protect Project Stability

All changes should improve:

• maintainability  
• security  
• clarity  
• stability

Never introduce complexity without clear benefit.

---

# Maintainers

Devil n Dove Workshop  
Ontario, Canada

Laurie Rosevear  
Jack Rosevear
