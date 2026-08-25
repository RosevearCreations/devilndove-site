# Build 420 Validation

Build 420 validation is intentionally local-only. It does not contact Cloudflare, D1 or R2 and cannot mutate Production.

From the `dev` branch run:

```bash
python scripts/build420_index_semantics_regression.py
python scripts/build420_parity_hardening_preflight.py
```

Expected result:

```text
BUILD 420 INDEX SEMANTICS REGRESSION: PASS
Cases checked: 6
No Cloudflare resource was contacted.

BUILD 420 TWENTY-ITEM PARITY HARDENING PREFLIGHT: PASS (20/20)
No Cloudflare resource was contacted.
No database or R2 mutation was executed.
PRODUCTION PROMOTION: CLOSED
```

If either local gate fails, preserve the output and do not start Build 421 live evidence work until the source mismatch is resolved.

Build 421 remains read-only. Production schema mutation stays closed until its twenty evidence/manifest items are complete and reviewed.
