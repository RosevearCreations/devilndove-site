# Sanity Health Check — Development Build 441

Updated: 2026-08-27

Build 441 is the current Development convergence release. Historical Build 439/440 tests remain source/regression provenance; unfinished evidence is represented as a current Build 441 HOLD.

## Repeatable source authority

Run:

```bash
python scripts/build441_current_sanity_check.py
```

The runner is source-only and has no Cloudflare/D1/R2/provider or separate live Production mutation capability.

## Green inherited evidence

- Build 440 source/Windows D1 transport gates: GREEN.
- Product reversible save/persist/restore and safe failure: GREEN live provenance.
- Inventory/kit ownership/failure/no-side-effect checks: GREEN live provenance.
- Tool lifecycle/history/publication/failure/no-change checks: GREEN live provenance.
- Public Tool/Supply D1 authority with no fallback: GREEN live provenance.
- Cross-mutation/responsive source gate: 35/35 GREEN.
- Fresh-install Product/Inventory/Tool aggregate-schema authority retained.

## Current Build 441 HOLDs/notes

- **CAIP private-media HOLD:** private R2 delivery/range seeking/exact timecode/storage live proof remains outstanding and is promotion-blocking.
- **Responsive live automation note:** prior iframe/pop-up harnesses were blocked by correct CSP/browser security controls. No responsive defect was thereby observed; source gate remains green.
- **Separate live Production promotion:** CLOSED by policy.

## Repository health

Build 441 begins retiring root historical reports when an exact archived copy already exists under `docs/archive/build-history/`. The hygiene gate prevents exact duplicates from returning. Migrations, runtime code and active regressions are not removed merely because their filenames are historical.
