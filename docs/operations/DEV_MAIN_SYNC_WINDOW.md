# Temporary Dev/Main Synchronization Window

## Current instruction

Until the owner explicitly changes this instruction, `dev` and `main` are to remain synchronized after each accepted update.

## Release mechanics

1. Implement each update on `dev` first.
2. Require the exact `dev` SHA to pass the canonical System Gate and applicable quality/runtime checks.
3. Fast-forward `main` to that exact green `dev` SHA; do not force-push or reconstruct either branch history.
4. Confirm the Production Pages deployment and public smoke/resource proofs on the exact synchronized SHA.
5. If a Production gate fails, keep the failure visible, repair through `dev`, prove the repair on its exact SHA, then fast-forward `main` to the repaired SHA.

## Data boundary

Branch synchronization is source synchronization. It does not authorize destructive D1/R2 changes. Database migrations, media recovery, deletion, overwrite, or other Production data mutation remain subject to their existing fail-closed guards and evidence requirements.

## Current reason

The synchronization window was requested while Storefront carousel/media improvements and Product/Movie image recovery are being completed, so Development and Production source do not drift during these closely related updates.
