# Devil n Dove Known Gaps and Risks — Build 225

## Status authority
Open, blocked, complete, and not-applicable launch decisions are maintained in `/admin/startup-readiness/`. Detailed instructions are in `STARTUP_GO_LIVE_GUIDE.md`. Current architecture and deployment boundaries are in `AI_HANDOFF.md`.

## Primary open risks
- Production payment/webhook idempotency and exact-once stock settlement/restoration remain unproven until saved evidence closes those gates.
- Final-unit and component-set concurrency may oversell until the production concurrency gate passes.
- Tax, shipping/pickup, email delivery/failure, policy, analytics, accessibility/mobile, restore, paid-order, and refund rehearsals must be completed.
- Launch products require accurate facts, approved media rights, working detail/gallery pages, physical stock, traceable lots, and final Product Release Preflight.
- Soap requires verified formula/INCI/bilingual facts, physical label proof, printer-fit export, and applicable Health Canada notification/change control.
- Browser Print/Save PDF is not a complete prepress/CMYK workflow.
- Automatic FIFO/FEFO lot consumption remains disabled until explicitly proven.
- Social OAuth remains dependent on provider credentials, scopes, review, and approval and is not a selling prerequisite when hidden/manual.
- First-page local search placement cannot be guaranteed.

## Packaging authority
`PACKAGING_STUDIO.md` is the one packaging source of truth. `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` is a compatibility pointer only.

## Product detail/gallery status
Builds 223–224 corrected the product-detail runtime error and legacy media-schema gallery collapse. Production verification remains required for every launch product, especially the intended seven-image gallery.
