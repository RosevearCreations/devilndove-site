# Build 369 — Today Tasks Schema Alignment

Build 369 hardens the Build 366 Today Tasks read implementation after Development browser diagnostics exposed four legacy query assumptions.

## Corrections

```text
legacy query                     current authority
site_items                       site_item_inventory
hst_gst_review_records           accounting_hst_gst_reviews
runtime_incidents.status         runtime_incidents.review_status
runtime_incidents.incident_id    runtime_incidents.runtime_incident_id
runtime_incidents.request_path   runtime_incidents.endpoint_path
```

The public contract remains Build 366. Build 369 is implementation metadata only; the Commerce runtime remains Build 367 and activation remains Build 368.

Inventory reorder review now uses current `site_item_inventory` fields (`is_on_reorder_list`, `reorder_level`, `do_not_reorder`, `on_hand_quantity`). Accounting evidence review now uses `accounting_hst_gst_reviews.remittance_evidence_url`. Runtime incident task counts/details use the current incident schema.

The D1 missing-table parser also strips punctuation before `SQLITE_ERROR`.

No request-time DDL/DML is introduced. `/api/admin/today-task-actions` remains the retained Done/Ignore/Snooze POST authority and mutation ownership does not move.

The older Build 339 `hst_gst_review_records` fresh-install parity finding remains separate; Build 369 does not erase or repair that historical schema-parity item.
