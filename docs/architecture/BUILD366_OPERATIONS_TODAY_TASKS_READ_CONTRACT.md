# Build 366 — Operations Today Tasks Read Contract

## Decision

Today Tasks is the next bounded Commerce & Operations target after Build 365.

The source audit compared Today Tasks with Custom Requests:

- `GET /api/admin/today-tasks` was already SELECT-only, but it silently converted failed reads into zero counts.
- `GET /api/admin/custom-requests` remains coupled to a large `ensureSchema()` authority containing CREATE/ALTER/INDEX work.
- `/admin/today-tasks/` was already classified as an Operations route but no real page existed.
- Today Tasks mutations already live separately at `POST /api/admin/today-task-actions`.

Custom Requests therefore remains outside this batch.

## Build 366 boundary

Build 366 adds `functions/api/_lib/todayTasksReadService.js` and the GET-only contract:

```text
/api/admin/contracts/operations-today-tasks-read
```

The read returns:

```text
build=366
contract=operations-today-tasks-read
owner=operations
request_time_schema_mutation=false
mutation_ownership_moved=false
schema_ready
missing_tables
query_errors
tasks
categories
suppressed_count
summary
```

Read failures no longer disappear as zero counts. Available task groups still render, while missing tables/query errors are reported explicitly.

Known schema-parity findings such as `hst_gst_review_records` may therefore surface as `schema_ready=false`; Build 366 does not create or repair them during GET.

## Mutation boundary

Done/Ignore/Snooze remains on:

```text
POST /api/admin/today-task-actions
```

Build 366 does not move or invoke that mutation authority during automatic page load.
