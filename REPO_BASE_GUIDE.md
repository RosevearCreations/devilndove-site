/docs/REPO_BASE_GUIDE.md
# Devil n Dove Repo Base Guide

This document explains the structure of the repository.

---

# Top Level


/
admin/
members/
public/
functions/
data/
assets/
css/
docs/
wrangler.toml


---

# Admin


/admin


Admin interface.

Functions:

- user management
- session maintenance
- dashboard metrics

---

# Members


/members


Authenticated member area.

Contains:

- password management
- session management

---

# Public JS


/public/js


Client side scripts.

Examples:


auth.js
admin-users.js
admin-delete-user.js
session-info.js
change-password.js


---

# Functions


/functions


Cloudflare Pages Functions.

Structure:


functions/api/auth/*
functions/api/admin/*


---

# Data


/data


Static JSON data.

Examples:


data/tools/toolshed_items_master.json
data/site/featured-items.json


---

# Assets


/assets


Site images.

---

# CSS


/css/styles.css


Main site stylesheet.

---

# Docs


/docs


Repository documentation.

---

# Wrangler


wrangler.toml


Cloudflare configuration.

Defines:

- D1 database
- R2 buckets
- environment bindings

---

# Deployment Flow


GitHub push
↓
Cloudflare Pages build
↓
Functions deploy
↓
Site live


---

# Local Development

Recommended:


npm install
wrangler pages dev


---

# Environment

Cloudflare resources used:

- Pages
- D1
- R2
