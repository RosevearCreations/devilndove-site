# Known Gaps and Risks compatibility pointer — Build 224

Current gaps and risks are maintained in:
1. `PROJECT_STATUS_AND_ROADMAP.md` — launch position, known risks, and next actions.
2. `STARTUP_GO_LIVE_GUIDE.md` — ordered launch blockers and exact verification instructions.
3. `AI_HANDOFF.md` — current architecture, deployment, and fallback boundaries.

## Product-detail and gallery status
The Build 223 product-detail outage is corrected. Build 224 also corrects the production-schema condition that could reduce a seven-image gallery to the single featured image. Production remains unverified until a known seven-image product returns seven `storefront_images` records and all seven thumbnails work publicly.

Images explicitly marked `blocked` or `consent_needed`, or linked to consent that does not allow public use, are intentionally excluded. Missing URLs, duplicate URLs, or images attached to a different product record also reduce the public count and should be corrected in Catalog Media rather than bypassed.

Packaging work must also read `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` and `PACKAGING_STUDIO.md`.
