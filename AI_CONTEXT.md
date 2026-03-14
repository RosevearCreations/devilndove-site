/docs/AI_CONTEXT.md
# AI_CONTEXT.md
Devil n Dove Website – AI Operational Context

This document is designed specifically for **AI assistants** (ChatGPT, Claude, Copilot, etc.) to understand how to safely work with this repository.

It explains:

• how the system works  
• how files are structured  
• how changes must be delivered  
• what rules must always be followed

The goal is to prevent **AI confusion, duplication, and architecture drift**.

---

# Project Identity

Project Name:

Devil n Dove Website

Purpose:

Official website and management system for the Devil n Dove Workshop.

System includes:

• public website  
• members login system  
• admin management dashboard  
• workshop catalog  
• future product catalog

---

# Technology Stack

Frontend

HTML  
CSS  
Vanilla JavaScript

Backend

Cloudflare Pages Functions

Database

Cloudflare D1 (SQLite)

Storage

Cloudflare R2

Deployment

GitHub → Cloudflare Pages

---

# Repository Structure


admin/
members/
functions/
public/
data/
assets/
css/
docs/


## Important directories

### admin/

Admin dashboard interface.

Handles:

• user management  
• system maintenance  
• site administration

---

### members/

Authenticated member pages.

Contains:

• password change  
• session management

---

### functions/

Cloudflare backend endpoints.

Structure:


functions/api/auth
functions/api/admin


AI must always follow this routing convention.

---

### public/js/

Client-side scripts.

Examples:


auth.js
admin-users.js
admin-delete-user.js
session-info.js
change-password.js


Scripts should remain **modular and single-purpose**.

---

### data/

Static JSON content used by site pages.

Examples:


data/tools/toolshed_items_master.json
data/site/featured-items.json


This will eventually be replaced by **admin content management**.

---

### assets/

Images and icons used by the website.

Large media stored in **Cloudflare R2**.

---

# Database Architecture

Database type:

Cloudflare **D1**

Tables:

### users


user_id
email
password_hash
display_name
role
is_active
created_at


### sessions


session_id
user_id
session_token
created_at
expires_at
ip_address
user_agent


### admin_logs (future)

Tracks administrative actions.

---

# Authentication Model

Authentication uses **session tokens**.

Process:

1. User logs in
2. Session token generated
3. Token stored in database
4. Token stored in browser
5. API calls authenticated via token

Session validity:


expires_at > datetime('now')


---

# Admin Permissions

Users have roles:


member
admin


Admin-only actions include:

• create users  
• update roles  
• deactivate users  
• reset passwords  
• delete users  
• clean expired sessions

---

# Safety Rules

AI must **never generate code that breaks these protections**.

Required protections:

• admin cannot delete themselves  
• admin cannot deactivate themselves  
• admin cannot demote their own role  
• last admin account cannot be deleted

---

# API Endpoint Structure

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


AI should **reuse existing endpoints** instead of creating duplicates.

---

# Development Rules for AI

When modifying this repository, AI must follow these rules.

## Always provide full files

Never provide partial snippets unless explicitly requested.

Always output:


complete document


---

## One file per response

Responses should contain **one file at a time**.

Example:


File:
/public/js/admin-users.js


---

## Always use code blocks

All code must be in proper fenced blocks.

Example:

code here

---

## Avoid architectural duplication

AI must not create:

• duplicate endpoints  
• duplicate schemas  
• duplicate data directories

---

## Preserve working features

AI should assume existing systems are **working unless stated otherwise**.

Do not rewrite working systems unnecessarily.

---

# Known Technical Issues

These must eventually be corrected.

### Database binding inconsistency

Some code references:


env.DB


While configuration may use:


DD_DB


Must standardize.

---

### Duplicate data folders

Both exist:


/data
/data/data


Only one should remain.

---

### Duplicate endpoint definitions

Some endpoints were created multiple times during development.

AI must standardize them.

---

# Security Goals

Future improvements should include:

• password complexity rules  
• login rate limiting  
• admin audit logging  
• session rotation after password change  
• improved validation

---

# Future Architecture Goals

Major improvements planned.

## Admin Content Manager

Replace JSON editing with admin UI.

Manage:

• featured creations  
• tools catalog  
• supplies catalog  
• gallery images  
• videos

---

## Workshop Inventory System

Admin panel for:

• tools  
• consumables  
• equipment

---

## Media Manager

Upload images directly to **Cloudflare R2**.

---

# AI Behavior Expectations

AI assistants must:

• respect existing architecture  
• avoid duplication  
• prefer incremental improvements  
• maintain security rules  
• output production-ready code

---

# When Starting a New AI Session

Paste the following files:


PROJECT_BRAIN.md
AI_CONTEXT.md


This gives the AI full understanding of:

• architecture
• database
• repo structure
• development rules

---

# Maintainers

Devil n Dove Workshop  
Ontario, Canada

Laurie Rosevear  
Jack Rosevear

---

# Status

Current stage:

Internal Alpha

Authentication and admin systems are operational.

Next milestone:

Repository cleanup and admin content management system.
