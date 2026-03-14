/docs/PROJECT_BRAIN.md
# Devil n Dove – Project Brain

This document summarizes the **architecture, purpose, and current status** of the Devil n Dove website and application.  
It is designed so a new developer or AI assistant can **instantly understand the project**.

---

# Project Overview

Devil n Dove is the official website and internal system for the **Devil n Dove Workshop**.

The platform supports:

• Public website  
• Members login area  
• Admin management system  
• Workshop tools & supplies catalog  
• Featured creations gallery  
• Future product catalog and content management

The site is built as a **Cloudflare-native application**.

---

# Technology Stack

Frontend

HTML  
CSS  
Vanilla JavaScript

Backend

Cloudflare Pages Functions

Database

Cloudflare **D1 (SQLite)**

Storage

Cloudflare **R2**

Deployment

GitHub → Cloudflare Pages

---

# Core Features

## Public Website

Pages:


/
/gallery
/creations
/tools
/supplies
/contact


Content is mostly **JSON-driven**.

Example:


/data/tools/toolshed_items_master.json
/data/site/featured-items.json


Images and media are stored in **Cloudflare R2**.

---

# Members System

Members can:

• login  
• logout  
• change password  
• view active sessions  
• log out other sessions

Session tokens stored in database.

Session expiration enforced.

---

# Admin System

Admin dashboard allows:

• create users  
• update roles  
• activate / deactivate users  
• reset passwords  
• delete users  
• clean expired sessions

Admin dashboard also displays:


Total Users
Active Users
Inactive Users
Admin Users
Active Sessions


---

# Safety Rules

Admin protections:

• cannot delete own account  
• cannot deactivate own account  
• cannot demote own admin role  
• cannot delete last remaining admin

---

# Database Schema

## users


user_id
email
password_hash
display_name
role
is_active
created_at


## sessions


session_id
user_id
session_token
created_at
expires_at
ip_address
user_agent


## admin_logs (future)

Tracks administrative actions.

---

# API Endpoints

## Authentication


/api/auth/login
/api/auth/logout
/api/auth/logout-all
/api/auth/me
/api/auth/change-password
/api/auth/session-info


## Admin


/api/admin/users
/api/admin/create-user
/api/admin/user-update
/api/admin/reset-password
/api/admin/delete-user
/api/admin/dashboard-summary
/api/admin/cleanup-sessions


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


### admin

Admin dashboard UI.

### members

Authenticated member pages.

### functions

Cloudflare backend functions.

Structure:


functions/api/auth
functions/api/admin


### public/js

Frontend scripts.

Examples:


auth.js
admin-users.js
admin-delete-user.js
session-info.js
change-password.js


### data

Static JSON data used by site pages.

### assets

Images and icons used by the website.

---

# Deployment Flow


Developer pushes to GitHub
↓
Cloudflare Pages build
↓
Functions deploy
↓
Site updates


---

# Known Issues

Current repo contains a few technical inconsistencies.

### Database Binding Name

Some code uses:


env.DB


While configuration may use:


DD_DB


Must be standardized.

---

### Duplicate Data Paths

Both exist:


/data
/data/data


Should be consolidated.

---

### Duplicate Endpoints

Some endpoints were duplicated during development.

Should standardize around:


/api/auth/me


---

# Security Improvements Needed

Before production launch:

• password complexity enforcement  
• login rate limiting  
• admin action audit logging  
• session rotation after password change  
• improved error handling

---

# Future Features

Planned improvements include:

## Admin Content Management

Admin UI to manage:

• featured creations  
• tools list  
• supplies list  
• gallery images  
• videos

This would eliminate manual JSON editing.

---

## Inventory Manager

Admin panel for tracking:

• workshop tools  
• supplies  
• consumables  
• equipment locations

---

## Media Manager

Upload images and videos directly to R2.

---

## Blog / Updates

Internal blog system for Devil n Dove.

---

# Development Workflow

When working with this project:

• always provide complete file updates  
• one document per response  
• use code blocks  
• prioritize architecture correctness  
• avoid duplicating endpoints or schemas

---

# Maintainers

Devil n Dove Workshop  
Ontario, Canada

Creators:

Laurie Rosevear  
Jack Rosevear

---

# Status

Current stage:

**Internal Alpha**

Authentication and admin management are functional.

Next milestone:

**Repository cleanup and admin content management system.**
