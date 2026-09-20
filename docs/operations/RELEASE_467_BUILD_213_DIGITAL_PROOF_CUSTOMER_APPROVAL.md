# Release 467 Build 213 — Digital Proof & Customer Approval

## Goal

Add versioned customer-facing design proof approval/revision to the existing Custom Work journey without creating another customer portal, Packaging version system, image store or publication authority.

## Exact starting boundary

Build 212 **Hybrid Creative Project Operations** is fully Production GREEN.

- Development SHA: `7891a869d748072846a1ac9452782e119f01cd53`
- Production main: `9ea6c728a4df978d653be910388ea7081b800de9`
- Shared tree: `f972119d10f98ea566173868915463ce31cdf22c`
- Development proofs: `35526209718` / `35526209719` / `35526209723` / `35526209630`
- Build 212 Development proof: `35526209730`
- Production Pages / Live Resources: `35526432043` / `35526530121`
- Product Browser / Route: `35526530105` / `35526530131`
- Build 212 Production proof: `35526432021`
- Exact Production URL: `https://f3bd9a21.devilndove-site.pages.dev`

## Existing authority extended

- `custom_requests` remains Custom Work authority.
- Manufacturing Triage remains proof/sample requirement authority.
- Packaging Studio `packaging_project_versions` remains immutable Packaging design/version authority.
- customer-safe stage photos remain media-owned.
- CAIP remains private/source media authority and is not exposed.
- publication/consent authorities remain separate.

## Build 213 schema

Canonical migration `0013_release467_digital_proof_customer_approval.sql` adds:

- `custom_request_proof_versions` — ordered proof versions, private token, exact response state and optional source references;
- `custom_request_proof_events` — append-only created/sent/viewed/approved/changes-requested/expired/superseded/internal-review history.

## Admin workflow

Embedded in `/admin/custom-request/`.

Staff can create a private draft from:

- text-only proof context;
- explicitly customer-safe URL;
- already customer-cleared stage photo;
- immutable saved Packaging version.

Activating a proof marks any prior active customer proof as superseded and creates a private link. It does **not** send email/provider messages automatically.

## Customer workflow

`/custom-request/proof/?token=...` is private, noindex/nofollow and no-referrer.

The customer may:

- review the exact version;
- approve that exact version; or
- request changes with a note.

Approval does not authorize publication, payment or automatic production.

## Production proof gate

When Manufacturing Triage says proof/sample is required:

- no customer-approved current proof => production proof gate fails closed;
- customer approved + separate internal production approval required but pending/rejected => gate fails closed;
- exact customer-approved version + required internal approval complete => proof gate is ready.

This gate reports readiness only; it does not start production.

## Non-overlap / safety boundary

- no parallel Custom Work authority;
- no duplicate Packaging layout/version ownership;
- no raw/private CAIP original exposure;
- no automatic publication or consent;
- no provider messaging;
- no payment execution;
- no Inventory mutation/reservation;
- no request-time DDL;
- Production business data remains Production-owned.

## Next

Release 467 Build 214 — Prototype → Sample → Production Run — remains blocked until Build 213 is exact-SHA Production GREEN.
