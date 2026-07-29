# Known Gaps and Risks compatibility pointer — Build 223

Current gaps and risks are maintained in:
1. `PROJECT_STATUS_AND_ROADMAP.md` — launch position, known risks and next 20 actions.
2. `STARTUP_GO_LIVE_GUIDE.md` — ordered launch blockers and exact verification instructions.
3. `AI_HANDOFF.md` — current architecture, deployment and fallback boundaries.

## Product-detail status
The known `normalizeResults(...).catch is not a function` defect is corrected in Build 223. Production remains unverified until active product cards have been opened after deployment and `/api/product-detail?slug=...` returns HTTP 200 with `ok:true`. Optional product-detail sections may degrade with warnings, but the core product page must remain usable.

Packaging work must also read `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` and `PACKAGING_STUDIO.md`.
