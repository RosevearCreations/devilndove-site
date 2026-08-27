# I.T. Preflight / Startup Release Guide — Build 442

This is the operator authority for open technical release issues. Business/product feature work belongs in `PROJECT_STATUS_AND_ROADMAP.md`; technical release HOLDs belong here and in `docs/releases/BUILD442_RELEASE_GATE.md`.

## Startup sequence

1. Confirm `development-release.json` is the intended Development build.
2. Confirm source branch is `dev` and the target is `devilndove-site-dev`, never the separate live Production project.
3. Run the active GitHub source gate.
4. Confirm D1 migration/schema ledger and aggregate-schema authority.
5. Confirm required D1/R2 bindings are present without displaying secret values.
6. Review runtime incidents, public API health and route usage.
7. Review service-worker/cache identity and offline behavior.
8. Review backup/restore and operational-continuity evidence.
9. Review every current HOLD. A HOLD stays visible until the exact remaining proof exists.
10. Deploy only the exact green `dev` head to the Development project, then perform bounded live acceptance.
11. Keep separate live Production promotion closed unless explicitly authorized.

## Current technical HOLDs

- **I.T. authority/enforcement HOLD:** apply and verify the guarded Development D1 migration before Phase B runtime enforcement.
- **Stripe Development HOLD:** test configuration, simulated checkout, return, signed webhook and duplicate replay must agree on the exact current deployment.
- **PayPal Development HOLD:** sandbox configuration, approval/capture, return, verified webhook and duplicate replay must agree on the exact current deployment.
- **CAIP private media evidence HOLD:** private R2 media delivery/range seeking, exact timecode/range and storage evidence remain to be proven live.
- **Responsive automation note:** source contract is green; prior automated live viewport harness was blocked by CSP/browser controls, not an observed application defect.
- **Production promotion HOLD:** deliberate policy boundary.

## Existing technical authorities

Use the I.T. hub `/admin/it-platform/` as the parent index. Existing specialist pages remain separate authorities for Startup Readiness, Release & Go-Live, Deployment Preflight, Release Evidence, Deploy Readiness, Application Sanity, Runtime Incidents, Public API Health, Route Usage, Schema Drift, Markdown Sanity, Operational Continuity, Promotion Control, Go-Live Execution and Live Ops Follow-through.

The I.T. hub contains the exact current-release correction mechanic and pass condition for each bridged obstacle. Earlier build documents remain historical evidence only. The safe payment readiness button checks configuration booleans/mode and never exposes secrets or proves end-to-end payment acceptance.

## Stop conditions

Stop a release and record a HOLD when schema authority is uncertain, the exact deployed commit is unknown, a required binding is absent, failures return raw HTML/false success, a destructive action cannot be bounded/reversed, or any command could contact the separate live Production project unintentionally.
