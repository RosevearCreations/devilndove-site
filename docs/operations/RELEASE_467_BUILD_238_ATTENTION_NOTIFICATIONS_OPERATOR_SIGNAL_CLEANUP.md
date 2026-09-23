# Release 467 Build 238 — Attention, Notifications & Operator Signal Cleanup

Build 238 starts from exact Build 237 Development and Production GREEN.

## Scope
Build 238 does not create a new inbox or database authority. It preserves Runtime Incidents as the operational incident/resolution authority, Notification Queue as the delivery-job authority, and Today Needs Attention as an existing operator route.

The shared presentation contract:
- ranks existing signals using severity, age and existing ownership facts;
- keeps critical/error/warning records visually prominent;
- makes old sent/resolved/info records quieter without hiding them;
- labels the owning workspace so duplicated attention cards route back to the canonical authority;
- preserves all existing retry, review, ignore, snooze, resolve, archive and audit controls.

## Safety
No schema change, request-time DDL, new API authority, automatic business action, Product publication, Inventory movement, Finance posting, D1/R2 business mutation or provider publication is introduced.
