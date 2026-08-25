# Build 369 Validation — Today Tasks Schema Alignment

## Status — STAGED / LOCAL + BROWSER REVALIDATION REQUIRED

Build 369 preserves the Build 366 Today Tasks public contract and Build 367/368 loader boundary while aligning the read implementation to current Development schema.

```text
contract build          366
implementation build    369
runtime build           367
activation build        368
```

## Browser defect evidence

Initial Build 366 browser proof returned HTTP 200 and a fully active Commerce runtime, but readiness exposed four query failures:

```text
site_items missing
hst_gst_review_records missing
runtime_incidents.status missing
runtime_incidents.incident_id missing
```

Source/schema audit showed those were legacy query assumptions. Current authorities are `site_item_inventory`, `accounting_hst_gst_reviews`, and current `runtime_incidents` columns `runtime_incident_id`, `review_status`, `endpoint_path`.

## Local regression

```bash
python scripts/build366_368_today_tasks_runtime_test.py
python scripts/build369_today_tasks_schema_alignment_test.py
```

Expected:

```text
BUILDS 366-368 TODAY TASKS RUNTIME: PASS
No Cloudflare resource was contacted.
BUILD 369 TODAY TASKS SCHEMA ALIGNMENT: PASS
No Cloudflare resource was contacted.
```

## Browser revalidation

On `/admin/today-tasks/`, use GET-only proof. Expected:

```text
contract_status                200
contract_build                 366
contract_implementation_build  369
schema_ready                   true
missing_tables                 []
query_error_count              0
runtime_build                  367
activation_build               368
today_tasks_page_proven        true
creates_network_transport      false
today_tasks_mutation_ownership false
```

Do not click Done, Ignore, or Snooze during validation.
