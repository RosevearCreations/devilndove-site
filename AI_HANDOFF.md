# Devil n Dove AI Handoff — Build 225

## Build 225 outcome
Build 225 converts launch readiness from a static twenty-card guide into a database-backed operating cockpit and consolidates packaging into one authoritative specification.

### Startup Readiness authority
- `/admin/startup-readiness/` is the status interface.
- `startup_readiness_items` stores the current item, phase, severity, status, owner, due date, evidence, blocked reason, internal route, external location, detailed instructions, and pass condition.
- `startup_readiness_history` stores each status/evidence transition.
- Complete or Not Applicable requires evidence notes or a safe evidence link.
- Blocked requires a clear reason.
- When D1/network saving fails, the browser may keep a visibly Unsynced local recovery copy; it is not server evidence until synchronization succeeds.
- `STARTUP_GO_LIVE_GUIDE.md` is the detailed human-readable copy of all 37 gates.

### Packaging authority
- `PACKAGING_STUDIO.md` is the only editable packaging and soap-label source of truth.
- It contains the complete user-provided Version 1.0 specification plus current implementation mapping, dimension conflict, approval boundaries, and remaining work.
- Root and documentation-tree `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` files are compatibility pointers only.
- The Packaging Studio and Soap Label Studio show direct links to the authoritative file and startup packaging gates.

### Deployment
1. Back up production D1.
2. Apply `database_build225_startup_readiness_packaging_authority.sql` or the identical `database_upgrade_current_pass.sql`, not both.
3. Deploy the complete Build 225 package.
4. Open `/admin/startup-readiness/`, refresh/seed the list, and verify existing status changes persist after reload.
5. Follow `BUILD225_VALIDATION.md`.

### Unchanged launch boundaries
Product-detail and seven-image gallery fixes from Builds 223–224 remain active. Production proof is still required for live payment/webhook idempotency, exact-once inventory settlement/restoration, taxes, shipping, email, physical labels, regulatory workflow, restore rehearsal, and paid-order/refund rehearsals.

### SEO, UI, and fallback rules
- Exactly one H1 per exposed HTML page.
- Public indexable pages require distinctive titles, useful descriptions, canonical URLs, descriptive internal links, truthful visible wording, and structured data that matches visible facts.
- Local search work must improve relevance and trust without promising first-page placement.
- Admin pages remain noindex where appropriate.
- Mobile touch targets, overflow, keyboard operation, CSS balance, low-bandwidth fallbacks, structured errors, runtime incidents, audited sensitive actions, and honest degraded states remain required every pass.
