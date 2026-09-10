# Release 467 Build 93 — Centered Application Shell & Overflow Accessibility

Build 93 starts from the exact fully-green Build 92 Development and Production checkpoint:

- SHA `67bca9198c0973ffe2b39818c3b933ec2737cc00`
- tree `f3fa062060cd53eb5e4b7dab42b2ba6d1fae0450`
- System Gate `34506095955` SUCCESS
- Current Application Quality `34506095848` SUCCESS
- I.T. Admin Runtime Proof `34506095837` SUCCESS
- Repository Branch Hygiene `34506095835` SUCCESS
- Production Pages Deploy `34506354596` SUCCESS
- Production Live Resource Integrity `34506453451` SUCCESS.

## Problem repaired

A shared responsive rule clipped horizontal overflow at the root document while some legacy/admin containers could also hide overflowing children. On a sufficiently wide data surface, that combination could leave a blank-looking area on one side while important right-side content existed outside the reachable viewport.

Build 93 repairs this globally instead of adding a page-specific offset.

## Centered application shell

Public and admin application shells are explicitly centered with viewport-bounded width. `.container` and `.admin-shell` retain automatic inline margins across phone, tablet, desktop/application and wide-web layouts. The runtime presentation guard also marks dynamically encountered shells with a centered-shell class so later-rendered application content follows the same boundary.

## Horizontal overflow accessibility

The root document no longer uses horizontal `clip`. If an unknown legacy control still exceeds its container, the user can recover/reach it instead of having it silently disappear.

Known wide data surfaces — tables, admin table wrappers and responsive data regions — keep horizontal overflow local to that component. The shared runtime guard gives those regions keyboard focus and an accessible region label, so right-side data can be reached without shifting the entire application canvas.

Grid, card, form and panel descendants use `min-width:0` / `max-width:100%` safeguards. Long text, identifiers and code-like tokens wrap where practical rather than forcing the whole page off-center.

## SEO and accessibility

The layout guard remains presentation-only and does not create, delete or rename headings. The one-H1 rule remains unchanged. Existing dynamic table containment is retained and improved with keyboard-reachable scroll regions.

## Safety and release boundaries

Build 93 changes no business data and introduces no D1 schema migration. Canonical D1 migrations remain exactly `0001`–`0004`. There is no request-time DDL, D1/R2 mutation, binding mutation, provider execution, provider publication or automatic Production promotion in this layout repair.

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported.

## Closure policy

Build 93 cannot self-claim its post-merge proof. It must first be fast-forwarded to `dev`, then earn the exact branch-head System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene, including exact Preview/D1/binding/smoke acceptance. Only that same exact SHA/tree may then be promoted non-force to `main`. Production Pages Deploy and Production Live Resource Integrity must both succeed before Build 93 is called externally complete.
