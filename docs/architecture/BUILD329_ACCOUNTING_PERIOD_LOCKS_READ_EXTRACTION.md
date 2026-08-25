# Build 329 — Accounting Period Locks Read Extraction

Build 329 makes `GET /api/admin/accounting-period-locks` non-mutating.

Previously GET ensured three schemas: period closures, attachments and statement imports, even though the read only returned period closure state. The GET now delegates to an Accounting-owned service that reads only `accounting_period_closures` and reports schema readiness without creating anything.

The POST lock/reopen path is unchanged in authority and retains its existing write-side ensure/check behavior, including attachment/import/reconciliation prerequisites.
