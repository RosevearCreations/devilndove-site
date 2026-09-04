# Devil n Dove Prelaunch Process Playbook

Use the current application surfaces rather than historical numbered checklists.

## Current sequence

1. **Application sanity** — `/admin/application-sanity/`
2. **Online help / operating rules** — `/admin/help/`
3. **Pre-deploy validation** — `/admin/deployment-preflight/`
4. **Development exact-preview acceptance** — canonical System Gate
5. **Promote / hold decision** — `/admin/deploy-readiness/`
6. **Production deployment** — exact green Development tree only
7. **Production smoke and live follow-through** — `/admin/live-ops-followthrough/`

## Non-negotiable boundaries

- canonical D1 migrations only; no request-time DDL
- no blind Development-to-Production business-data overwrite
- no main-only application fixes
- no provider or publication acceptance without current real evidence
- one H1 per indexable public page
- search results and empty templates are not sitemap targets
- important phone and desktop content must remain equivalent
- secrets never belong in screenshots, visible help or source-controlled reference data

Historical playbooks remain available through Git history when provenance is needed.
