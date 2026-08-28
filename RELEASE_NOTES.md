# Development Release Notes — Build 446

## Repository deep retirement

Build 446 reduces the active Development repository to current runtime, current authority, current recovery and active operational tooling.

- Git history is now the historical archive; `docs/archive` and `docs/releases` are retired.
- Historical root Build Markdown, obsolete verification SQL, superseded incremental `database_build*.sql`, temp placeholders and stale troubleshooting snapshots are retired.
- `scripts/` is reduced from the long Build 190–445 evidence/test chain to current CI/D1 recovery plus three SEO bake utilities.
- `database_full_schema.sql` remains the fresh-install aggregate authority.
- Standalone Build 440/442/443 migrations/verifiers remain only because the current guarded Development recovery path still consumes them.
- `scripts/repository_forward_sanity.py` and the single Build 446 system gate prevent historical bulk from returning.
- Build 446 introduces no D1 migration and no provider/Production mutation.

## Forward status

Carousel/I.T. schema proof where still missing, Stripe, PayPal and CAIP private-media evidence remain current Build 446 HOLDs. Separate live Production promotion remains closed.
