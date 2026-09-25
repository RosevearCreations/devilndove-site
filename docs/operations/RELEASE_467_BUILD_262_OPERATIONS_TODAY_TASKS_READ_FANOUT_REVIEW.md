# Release 467 Build 262 — Operations Today-Tasks Read Fan-Out Review

## Purpose

Build 262 re-measures the Build 250 `operations-today-tasks-read` hotspot and applies only the bounded read-path change supported by that evidence.

Build 250 measured **13 top-level read statements**, **1,132 Today Tasks provider rows read** under a hard **15,000** ceiling, and **2,178 aggregate rows read** under a hard **25,000** ceiling. Build 256 retained this as the remaining read-path hotspot.

## Bounded change

The runtime still executes the same six task-count reads and the same runtime-incident detail read. The only implementation change is the latest Today Task action lookup:

- before: six independent indexed D1 statements, one per task key;
- Build 262: one compound read-only D1 statement containing the same six indexed `task_key` point lookups with the same `created_at DESC, today_task_action_id DESC LIMIT 1` semantics.

The six keys remain `readiness`, `custom_requests`, `orders`, `inventory`, `accounting`, and `failed_api`.

Expected top-level provider statement fan-out is therefore **13 → 8**, a reduction of **5 statements**.

## Measurement boundary

The provider probe runs only against canonical Development D1 `devilndove-dev`. It re-measures Today Tasks and Seller Daily together and keeps the existing Build 250 ceilings unchanged:

- Today Tasks: **≤15,000 rows read**
- Seller Daily: **≤10,000 rows read**
- Aggregate: **≤25,000 rows read**
- Today Tasks provider metadata rows: **exactly 8 statements**

Live row counts can change as Development data changes, so Build 262 does not require the absolute row count to equal Build 250's 1,132. It requires the same ceilings and a lower statement fan-out.

## Safety

No schema change, request-time DDL, D1 write, R2 write, Production D1 contact, Product publication, Inventory movement, Finance posting, provider execution/publication or automatic business action is introduced.

Exact-SHA promotion and identical Development/Production tree continuity remain mandatory.

## Successor

The future queue remains open. Next is **Build 263 — Release Efficiency & Read-Budget Outcome Verification**.
